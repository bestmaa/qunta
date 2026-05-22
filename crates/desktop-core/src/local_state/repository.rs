use rusqlite::{params, Connection};

use crate::local_state::migrations::run_migrations;
use crate::local_state::models::{AuditEvent, LocalSetting, RecentProject, StoredSession};
use crate::DesktopResult;

pub struct LocalStateRepository {
    connection: Connection,
}

impl LocalStateRepository {
    pub fn in_memory() -> DesktopResult<Self> {
        Self::open(Connection::open_in_memory()?)
    }

    pub fn open(connection: Connection) -> DesktopResult<Self> {
        run_migrations(&connection)?;
        Ok(Self { connection })
    }

    pub fn save_setting(&self, setting: &LocalSetting) -> DesktopResult<()> {
        self.connection.execute(
            "INSERT INTO settings (key, value, updated_at)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value,
             updated_at = excluded.updated_at",
            params![setting.key, setting.value, setting.updated_at],
        )?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> DesktopResult<Option<LocalSetting>> {
        let mut statement = self
            .connection
            .prepare("SELECT key, value, updated_at FROM settings WHERE key = ?1")?;
        let mut rows = statement.query_map(params![key], |row| {
            Ok(LocalSetting {
                key: row.get(0)?,
                value: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })?;

        rows.next().transpose().map_err(Into::into)
    }

    pub fn save_recent_project(&self, project: &RecentProject) -> DesktopResult<()> {
        self.connection.execute(
            "INSERT INTO recent_projects (id, name, path, last_opened_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name,
             path = excluded.path, last_opened_at = excluded.last_opened_at",
            params![
                project.id,
                project.name,
                project.path,
                project.last_opened_at
            ],
        )?;
        Ok(())
    }

    pub fn recent_projects(&self) -> DesktopResult<Vec<RecentProject>> {
        let mut statement = self.connection.prepare(
            "SELECT id, name, path, last_opened_at
             FROM recent_projects ORDER BY last_opened_at DESC",
        )?;
        let rows = statement.query_map([], |row| {
            Ok(RecentProject {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                last_opened_at: row.get(3)?,
            })
        })?;

        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
    }

    pub fn save_session(&self, session: &StoredSession) -> DesktopResult<()> {
        self.connection.execute(
            "INSERT INTO sessions (id, project_id, status, created_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![
                session.id,
                session.project_id,
                session.status,
                session.created_at
            ],
        )?;
        Ok(())
    }

    pub fn save_audit_event(&self, event: &AuditEvent) -> DesktopResult<()> {
        self.connection.execute(
            "INSERT INTO audit_events (id, session_id, kind, message, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                event.id,
                event.session_id,
                event.kind,
                event.message,
                event.created_at
            ],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::{AuditEvent, LocalSetting, LocalStateRepository, RecentProject, StoredSession};

    #[test]
    fn stores_settings_and_projects() {
        let repository = LocalStateRepository::in_memory().expect("repo");
        let setting = LocalSetting {
            key: String::from("theme"),
            updated_at: String::from("2026-05-22T00:00:00Z"),
            value: String::from("dark"),
        };
        let project = RecentProject {
            id: String::from("project-1"),
            last_opened_at: String::from("2026-05-22T00:00:01Z"),
            name: String::from("Qunta"),
            path: String::from("/tmp/qunta"),
        };

        repository.save_setting(&setting).expect("save setting");
        repository
            .save_recent_project(&project)
            .expect("save project");

        assert_eq!(repository.get_setting("theme").expect("get"), Some(setting));
        assert_eq!(
            repository.recent_projects().expect("projects"),
            vec![project]
        );
    }

    #[test]
    fn stores_sessions_and_audit_events() {
        let repository = LocalStateRepository::in_memory().expect("repo");
        let session = StoredSession {
            created_at: String::from("2026-05-22T00:00:00Z"),
            id: String::from("session-1"),
            project_id: String::from("project-1"),
            status: String::from("running"),
        };
        let event = AuditEvent {
            created_at: String::from("2026-05-22T00:00:02Z"),
            id: String::from("event-1"),
            kind: String::from("session_started"),
            message: String::from("Session started"),
            session_id: Some(String::from("session-1")),
        };

        repository.save_session(&session).expect("save session");
        repository.save_audit_event(&event).expect("save event");
    }
}
