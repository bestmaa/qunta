use std::{
    io::{BufRead, BufReader, Read},
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::mpsc::{self, Receiver, Sender, TryRecvError},
    thread::{self, JoinHandle},
};

use desktop_core::{DesktopError, DesktopResult};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct ProcessSpec {
    pub program: String,
    pub args: Vec<String>,
    pub cwd: Option<PathBuf>,
}

impl ProcessSpec {
    pub fn new(program: impl Into<String>) -> Self {
        Self {
            program: program.into(),
            args: Vec::new(),
            cwd: None,
        }
    }

    pub fn with_args(mut self, args: impl IntoIterator<Item = impl Into<String>>) -> Self {
        self.args = args.into_iter().map(Into::into).collect();
        self
    }

    pub fn validate(&self) -> DesktopResult<()> {
        if self.program.trim().is_empty() {
            return Err(DesktopError::invalid_config("process program is required"));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum ProcessEvent {
    Stdout(String),
    Stderr(String),
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct ProcessExit {
    pub code: Option<i32>,
    pub cancelled: bool,
    pub events: Vec<ProcessEvent>,
}

pub struct AgentProcess {
    child: Option<Child>,
    events: Receiver<ProcessEvent>,
    readers: Vec<JoinHandle<()>>,
}

impl AgentProcess {
    pub fn spawn(spec: ProcessSpec) -> DesktopResult<Self> {
        spec.validate()?;

        let mut command = Command::new(&spec.program);
        command
            .args(&spec.args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .stdin(Stdio::null());

        if let Some(cwd) = &spec.cwd {
            command.current_dir(cwd);
        }

        let mut child = command
            .spawn()
            .map_err(|error| DesktopError::process_failed(error.to_string()))?;
        let (sender, events) = mpsc::channel();
        let mut readers = Vec::new();

        if let Some(stdout) = child.stdout.take() {
            readers.push(spawn_reader(stdout, sender.clone(), StreamKind::Stdout));
        }

        if let Some(stderr) = child.stderr.take() {
            readers.push(spawn_reader(stderr, sender, StreamKind::Stderr));
        }

        Ok(Self {
            child: Some(child),
            events,
            readers,
        })
    }

    pub fn try_next_event(&self) -> DesktopResult<Option<ProcessEvent>> {
        match self.events.try_recv() {
            Ok(event) => Ok(Some(event)),
            Err(TryRecvError::Empty) => Ok(None),
            Err(TryRecvError::Disconnected) => Ok(None),
        }
    }

    pub fn wait(mut self) -> DesktopResult<ProcessExit> {
        let mut child = self
            .child
            .take()
            .ok_or_else(|| DesktopError::process_failed("process already finished"))?;
        let status = child
            .wait()
            .map_err(|error| DesktopError::process_failed(error.to_string()))?;

        self.join_readers()?;
        Ok(ProcessExit {
            code: status.code(),
            cancelled: false,
            events: self.drain_events(),
        })
    }

    pub fn cancel(&mut self) -> DesktopResult<ProcessExit> {
        let mut child = self
            .child
            .take()
            .ok_or_else(|| DesktopError::process_failed("process already finished"))?;

        let _ = child.kill();
        let status = child
            .wait()
            .map_err(|error| DesktopError::process_failed(error.to_string()))?;

        self.join_readers()?;
        Ok(ProcessExit {
            code: status.code(),
            cancelled: true,
            events: self.drain_events(),
        })
    }

    fn join_readers(&mut self) -> DesktopResult<()> {
        while let Some(reader) = self.readers.pop() {
            reader
                .join()
                .map_err(|_| DesktopError::process_failed("stream reader panicked"))?;
        }

        Ok(())
    }

    fn drain_events(&self) -> Vec<ProcessEvent> {
        let mut events = Vec::new();

        while let Ok(event) = self.events.try_recv() {
            events.push(event);
        }

        events
    }
}

impl Drop for AgentProcess {
    fn drop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

#[derive(Debug, Clone, Copy)]
enum StreamKind {
    Stdout,
    Stderr,
}

fn spawn_reader<R>(stream: R, sender: Sender<ProcessEvent>, kind: StreamKind) -> JoinHandle<()>
where
    R: Read + Send + 'static,
{
    thread::spawn(move || {
        for line in BufReader::new(stream).lines().map_while(Result::ok) {
            let event = match kind {
                StreamKind::Stdout => ProcessEvent::Stdout(line),
                StreamKind::Stderr => ProcessEvent::Stderr(line),
            };

            if sender.send(event).is_err() {
                break;
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use super::{AgentProcess, ProcessEvent, ProcessSpec};

    #[test]
    fn captures_stdout_and_stderr_events() {
        let process = AgentProcess::spawn(echo_spec()).expect("process starts");
        let exit = process.wait().expect("process exits");

        assert_eq!(exit.code, Some(0));
        assert!(!exit.cancelled);
        assert!(exit.events.iter().any(|event| matches!(
            event,
            ProcessEvent::Stdout(line) if line.trim() == "runner-out"
        )));
        assert!(exit.events.iter().any(|event| matches!(
            event,
            ProcessEvent::Stderr(line) if line.trim() == "runner-err"
        )));
    }

    #[test]
    fn cancels_running_process() {
        let mut process = AgentProcess::spawn(sleep_spec()).expect("process starts");
        let exit = process.cancel().expect("process cancels");

        assert!(exit.cancelled);
    }

    #[test]
    fn rejects_empty_program() {
        assert!(AgentProcess::spawn(ProcessSpec::new("")).is_err());
    }

    #[cfg(windows)]
    fn echo_spec() -> ProcessSpec {
        ProcessSpec::new("cmd").with_args(["/C", "echo runner-out && echo runner-err 1>&2"])
    }

    #[cfg(not(windows))]
    fn echo_spec() -> ProcessSpec {
        ProcessSpec::new("sh").with_args(["-c", "echo runner-out; echo runner-err 1>&2"])
    }

    #[cfg(windows)]
    fn sleep_spec() -> ProcessSpec {
        ProcessSpec::new("cmd").with_args(["/C", "ping 127.0.0.1 -n 6 > nul"])
    }

    #[cfg(not(windows))]
    fn sleep_spec() -> ProcessSpec {
        ProcessSpec::new("sh").with_args(["-c", "sleep 5"])
    }
}
