/**
 * lib/queries/verification-codes.ts
 * Gerir códigos de verificação por email (alternativa a Supabase Auth)
 */

import { query } from "@/lib/db";
import crypto from "crypto";

/**
 * Gera um código aleatório de 6 dígitos
 */
export function gerarCodigoVerificacao(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envia e armazena código de verificação
 * TTL: 15 minutos
 */
export async function criarCodigoVerificacao(email: string): Promise<string> {
  const codigo = gerarCodigoVerificacao();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  // Remover códigos antigos deste email
  await query("DELETE FROM verification_codes WHERE email = ?", [email]);

  // Inserir novo código
  await query(
    `
    INSERT INTO verification_codes (email, code, expires_at)
    VALUES (?, ?, ?)
    `,
    [email, codigo, expiresAt],
  );

  return codigo;
}

/**
 * Verifica se código é válido
 */
export async function verificarCodigoVerificacao(
  email: string,
  codigo: string,
): Promise<boolean> {
  const [rows] = await query(
    `
    SELECT id FROM verification_codes
    WHERE email = ? AND code = ? AND expires_at > NOW()
    LIMIT 1
    `,
    [email, codigo],
  );

  const result = (rows as any[]).length > 0;

  if (result) {
    // Remover código após uso bem-sucedido
    await query("DELETE FROM verification_codes WHERE email = ? AND code = ?", [
      email,
      codigo,
    ]);
  }

  return result;
}

/**
 * Limpa códigos expirados (executar periodicamente)
 */
export async function limparCodigosExpirados(): Promise<number> {
  const result = await query(
    `DELETE FROM verification_codes WHERE expires_at <= NOW()`,
  );

  return (result[1] as any).affectedRows || 0;
}
