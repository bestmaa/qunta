import { Button } from "@qunta/ui";
import { useMemo, useState } from "react";

export interface TerminalCommandGroup {
  readonly command: string;
  readonly cwd: string;
  readonly lines: readonly string[];
}

export interface TerminalLogPanelProps {
  readonly groups: readonly TerminalCommandGroup[];
}

export function maskTerminalLine(line: string) {
  return line
    .replace(/(token|secret|password|api[_-]?key)=\S+/gi, "$1=***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .replace(/\x1b\[[0-9;]*m/g, "");
}

export function TerminalLogPanel({ groups }: TerminalLogPanelProps) {
  const [query, setQuery] = useState("");
  const [paused, setPaused] = useState(false);
  const [cleared, setCleared] = useState(false);
  const visibleGroups = useMemo(() => {
    if (cleared) {
      return [];
    }

    return groups.map((group) => ({
      ...group,
      lines: group.lines
        .map(maskTerminalLine)
        .filter((line) => line.toLowerCase().includes(query.toLowerCase()))
    }));
  }, [cleared, groups, query]);

  return (
    <div className="terminal-panel">
      <div className="terminal-controls">
        <input
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search logs"
          value={query}
        />
        <Button onClick={() => setPaused(!paused)} size="sm">
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={() => setCleared(true)} size="sm">
          Clear
        </Button>
      </div>
      <div className="terminal-output" aria-live={paused ? "off" : "polite"}>
        {visibleGroups.length === 0 ? (
          <div className="empty-state">No command output.</div>
        ) : (
          visibleGroups.map((group) => (
            <section className="terminal-group" key={`${group.cwd}:${group.command}`}>
              <header>
                <strong>{group.command}</strong>
                <span>{group.cwd}</span>
              </header>
              {group.lines.map((line, index) => (
                <code key={`${group.command}-${index}`}>{line}</code>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
