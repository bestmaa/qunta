import { StatusBadge } from "@qunta/ui";
import { useMemo, useState } from "react";

export interface FileTreeEntry {
  readonly path: string;
  readonly status?: "added" | "modified" | "unchanged";
}

export interface FileTreeProps {
  readonly entries: readonly FileTreeEntry[];
  readonly ignoredEntries?: readonly string[];
}

const deniedPatterns = [".env", ".ssh/", ".aws/", "id_rsa", "credentials"];

export function filterVisibleEntries(
  entries: readonly FileTreeEntry[],
  search: string,
  ignoredEntries: readonly string[] = []
) {
  const normalized = search.trim().toLowerCase();
  return entries.filter((entry) => {
    const path = entry.path.toLowerCase();
    const ignored = ignoredEntries.some((name) => path.startsWith(`${name.toLowerCase()}/`));
    const denied = deniedPatterns.some((pattern) => path.includes(pattern));
    const matches = normalized.length === 0 || path.includes(normalized);
    return matches && !ignored && !denied;
  });
}

export function FileTree({ entries, ignoredEntries = [] }: FileTreeProps) {
  const [search, setSearch] = useState("");
  const visibleEntries = useMemo(
    () => filterVisibleEntries(entries, search, ignoredEntries),
    [entries, ignoredEntries, search]
  );

  return (
    <div className="file-tree">
      <input
        className="file-tree-search"
        onChange={(event) => setSearch(event.currentTarget.value)}
        placeholder="Search files"
        value={search}
      />
      <div className="file-tree-list" role="tree">
        {visibleEntries.length === 0 ? (
          <div className="empty-state">No files match.</div>
        ) : (
          visibleEntries.map((entry) => (
            <div className="file-tree-row" key={entry.path} role="treeitem">
              <span>{entry.path}</span>
              {entry.status && entry.status !== "unchanged" ? (
                <StatusBadge tone={entry.status === "added" ? "success" : "warning"}>
                  {entry.status}
                </StatusBadge>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
