import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const dbPath = resolve(process.cwd(), "prisma", "dev.db");
const journalPath = `${dbPath}-journal`;

for (const path of [dbPath, journalPath]) {
  if (existsSync(path)) unlinkSync(path);
}

console.log("Removed local SQLite database.");
