const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TARGET_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_DIRS = new Set([".git", ".next", ".next-dev", "node_modules"]);

const SQL_CALL_REGEX = /(?:query|connection\.execute)\s*\(\s*`([\s\S]*?)`/g;

function walk(dirPath, collector) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, collector);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (TARGET_EXTENSIONS.has(extension)) {
      collector.push(absolutePath);
    }
  }
}

function getLineForIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content[i] === "\n") line += 1;
  }
  return line;
}

function isSensitiveSql(sql) {
  const normalized = sql.toLowerCase();
  return (
    /(from|update|delete\s+from|insert\s+into|join)\s+candidato_respostas\b(?!_)/.test(
      normalized,
    ) ||
    /(from|update|delete\s+from|insert\s+into|join)\s+interviews\b/.test(
      normalized,
    )
  );
}

function hasCompanyScope(sql) {
  const normalized = sql.toLowerCase();
  return normalized.includes("company_id");
}

function isAllowedUnscoped(sql) {
  const normalized = sql.toLowerCase();
  if (normalized.includes("legacy_vaga_id")) return true;
  if (normalized.includes("insert into interviews")) return true;
  return false;
}

function run() {
  const allFiles = [];
  walk(ROOT, allFiles);

  const relevantFiles = allFiles.filter((filePath) => {
    const normalized = filePath.replace(/\\/g, "/").toLowerCase();
    return normalized.includes("/app/") || normalized.includes("/lib/");
  });

  const violations = [];

  for (const filePath of relevantFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    let match;

    SQL_CALL_REGEX.lastIndex = 0;
    while ((match = SQL_CALL_REGEX.exec(content)) !== null) {
      const rawSql = match[1] || "";
      if (!isSensitiveSql(rawSql)) continue;
      if (isAllowedUnscoped(rawSql)) continue;
      if (hasCompanyScope(rawSql)) continue;

      const relativePath = path.relative(ROOT, filePath).replace(/\\/g, "/");
      const line = getLineForIndex(content, match.index);
      violations.push({ file: relativePath, line, sql: rawSql.trim() });
    }
  }

  if (violations.length > 0) {
    console.error("[phase1:check] Falhas de isolamento por company_id encontradas:\n");
    for (const violation of violations) {
      const preview = violation.sql.split("\n").map((line) => line.trim()).join(" ").slice(0, 180);
      console.error(`- ${violation.file}:${violation.line}`);
      console.error(`  SQL: ${preview}`);
    }
    process.exit(1);
  }

  console.log("[phase1:check] OK - todas as queries sensíveis incluem escopo de company_id.");
}

run();
