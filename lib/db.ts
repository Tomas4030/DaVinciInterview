import "server-only";
import mysql from "mysql2/promise";

/**
 * Global instance for development hot-reloading
 * Evita criar novas conexões a cada hot-reload
 */
declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

/**
 * MySQL Connection Pool
 * - Server-only: Executa apenas no backend
 * - Reutilizável: Mesma pool durante toda a sessão
 * - Configurável: Via variáveis de ambiente
 */
export const db =
  global.__mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

// Guardar pool em dev para reutilização
if (process.env.NODE_ENV !== "production") {
  global.__mysqlPool = db;
}

/**
 * Type-safe query execution
 * @param sql SQL query string
 * @param values Parameter values (para prepared statements)
 * @returns [rows, fields] tuple
 *
 * @example
 * const [rows] = await query("SELECT * FROM users WHERE id = ?", [123]);
 */
export async function query<T = any>(
  sql: string,
  values?: any[],
): Promise<[T[], any]> {
  const connection = await db.getConnection();
  try {
    return (await connection.execute(sql, values)) as [T[], any];
  } finally {
    connection.release();
  }
}

/**
 * Begin transaction
 * @example
 * const conn = await getConnection();
 * try {
 *   await conn.beginTransaction();
 *   await conn.execute("INSERT ...", [...]);
 *   await conn.execute("UPDATE ...", [...]);
 *   await conn.commit();
 * } catch (e) {
 *   await conn.rollback();
 *   throw e;
 * } finally {
 *   conn.release();
 * }
 */
export async function getConnection() {
  return await db.getConnection();
}

/**
 * JSON helper para guardar objects de forma segura
 */
export function jsonStringify(obj: any): string {
  return JSON.stringify(obj);
}

/**
 * JSON helper para ler JSON do MySQL
 */
export function jsonParse<T = any>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("[JSON Parse Error]", e);
    return null;
  }
}
