import { readFileSync } from "node:fs";

const task = readFileSync("task.md", "utf8");
const taskCount = (task.match(/^#### T\d{4} - /gm) ?? []).length;
const statusCount = (task.match(/^- Status: `(pending|in_progress|completed)`$/gm) ?? []).length;

if (taskCount === 0) {
  console.error("task.md has no task headings");
  process.exit(1);
}

if (taskCount !== statusCount) {
  console.error(`task/status mismatch: ${taskCount} tasks, ${statusCount} statuses`);
  process.exit(1);
}
