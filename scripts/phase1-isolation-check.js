const mysql = require("mysql2/promise");

const REQUIRED_TABLES = [
  "users",
  "companies",
  "company_members",
  "interviews",
  "vagas",
  "candidato_respostas",
];

function fail(message) {
  throw new Error(message);
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [missingTablesRows] = await connection.execute(
      `
      SELECT t.table_name
      FROM (
        SELECT ? AS table_name UNION ALL
        SELECT ? UNION ALL
        SELECT ? UNION ALL
        SELECT ? UNION ALL
        SELECT ? UNION ALL
        SELECT ?
      ) t
      LEFT JOIN information_schema.tables ist
        ON ist.table_schema = DATABASE()
       AND ist.table_name = t.table_name
      WHERE ist.table_name IS NULL
      `,
      REQUIRED_TABLES,
    );

    if (missingTablesRows.length > 0) {
      const names = missingTablesRows.map((r) => r.table_name).join(", ");
      fail(`Tabelas em falta: ${names}`);
    }

    const [missingFKRows] = await connection.execute(
      `
      SELECT expected.constraint_name
      FROM (
        SELECT 'fk_companies_owner' AS constraint_name UNION ALL
        SELECT 'fk_company_members_company' UNION ALL
        SELECT 'fk_company_members_user' UNION ALL
        SELECT 'fk_interviews_company' UNION ALL
        SELECT 'fk_candidato_respostas_company' UNION ALL
        SELECT 'fk_candidato_respostas_interview'
      ) expected
      LEFT JOIN information_schema.referential_constraints rc
        ON rc.constraint_schema = DATABASE()
       AND rc.constraint_name = expected.constraint_name
      WHERE rc.constraint_name IS NULL
      `,
    );

    if (missingFKRows.length > 0) {
      const names = missingFKRows.map((r) => r.constraint_name).join(", ");
      fail(`FKs em falta: ${names}`);
    }

    const [orphanCompanies] = await connection.execute(
      `
      SELECT COUNT(*) AS total
      FROM companies c
      LEFT JOIN users u ON u.id = c.owner_id
      WHERE u.id IS NULL
      `,
    );
    if ((orphanCompanies[0]?.total || 0) > 0) {
      fail("Existem companies com owner_id órfão");
    }

    const [orphanMembers] = await connection.execute(
      `
      SELECT COUNT(*) AS total
      FROM company_members cm
      LEFT JOIN users u ON u.id = cm.user_id
      WHERE u.id IS NULL
      `,
    );
    if ((orphanMembers[0]?.total || 0) > 0) {
      fail("Existem company_members com user_id órfão");
    }

    const [nullScope] = await connection.execute(
      `
      SELECT COUNT(*) AS total
      FROM candidato_respostas
      WHERE company_id IS NULL OR interview_id IS NULL
      `,
    );
    if ((nullScope[0]?.total || 0) > 0) {
      fail("Existem candidaturas sem company_id/interview_id");
    }

    const [crossScope] = await connection.execute(
      `
      SELECT COUNT(*) AS total
      FROM candidato_respostas cr
      JOIN interviews i ON i.id = cr.interview_id
      WHERE cr.company_id <> i.company_id
      `,
    );
    if ((crossScope[0]?.total || 0) > 0) {
      fail("Existem candidaturas com interview de outra empresa");
    }

    const [questionsDefaultRows] = await connection.execute(
      `
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'interviews'
        AND column_name = 'questions'
      LIMIT 1
      `,
    );

    const questionsDefault = String(
      questionsDefaultRows[0]?.column_default || "",
    ).toLowerCase();

    if (!questionsDefault.includes("json_array")) {
      fail("A coluna interviews.questions não tem default JSON_ARRAY()");
    }

    console.log("[OK] Fase 1 isolamento validado com sucesso");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("[ERRO] Validação da Fase 1 falhou:", error.message || error);
  process.exit(1);
});
