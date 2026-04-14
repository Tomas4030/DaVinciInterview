/**
 * ⚠️ DEPRECATED: Este ficheiro foi removido após migração Supabase → MySQL
 *
 * Utilizar em vez disso:
 * - lib/db.ts (MySQL connection pool)
 * - lib/queries/* (Type-safe MySQL queries)
 *
 * A aplicação foi completamente migrada para MySQL.
 * Não utilize este ficheiro.
 */

import "server-only";

/**
 * @deprecated Use lib/db.ts em seu lugar
 */
export function createAdminClient() {
  throw new Error(
    "❌ createAdminClient foi deprecado. Use lib/db.ts e lib/queries/* em seu lugar.",
  );
}
