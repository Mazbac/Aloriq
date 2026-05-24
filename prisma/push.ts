import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function splitSql(script: string) {
  return script
    .split(";\n")
    .map((statement) =>
      statement
        .split("\n")
        .filter((line) => !line.trim().startsWith("--") && !line.trim().startsWith("warn "))
        .join("\n")
        .trim(),
    )
    .filter(Boolean)
    .map((statement) => (statement.endsWith(";") ? statement.slice(0, -1) : statement));
}

async function main() {
  const existing = await prisma.$queryRawUnsafe<Array<{ name: string }>>("SELECT name FROM sqlite_master WHERE type='table' AND name='User'");
  if (existing.length) {
    console.log("SQLite schema already exists. Skipping DDL.");
    return;
  }

  const sql = execSync("npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script", {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  for (const statement of splitSql(sql)) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log("SQLite schema created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
