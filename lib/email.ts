import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpHost = (process.env.SMTP_HOST || "").trim();
const forceSmtpTransport = process.env.SMTP_FORCE === "true";
const forceFallbackTransport = process.env.SMTP_USE_FALLBACK === "true";
const usingFallbackTransport =
  !forceSmtpTransport && (forceFallbackTransport || !smtpHost);

export const transporter = nodemailer.createTransport(
  (usingFallbackTransport
    ? {
        streamTransport: true,
        buffer: true,
        newline: "unix",
      }
    : {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      }) as any,
);

export async function sendVerificationCodeEmail(to: string, code: string) {
  const fromEmail = process.env.SMTP_FROM_EMAIL!;
  const fromName = process.env.SMTP_FROM_NAME || "Da Vinci";
  const message = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: "Código de verificação",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Verificação de email</h2>
        <p>O teu código é:</p>
        <div style="font-size:28px;font-weight:bold;letter-spacing:4px;margin:16px 0">
          ${code}
        </div>
        <p>Este código expira em 15 minutos.</p>
      </div>
    `,
    text: `Verificação de email\n\nO teu código é: ${code}\n\nEste código expira em 15 minutos.`,
  };

  const info = await transporter.sendMail(message);

  if (usingFallbackTransport) {
    console.warn(
      "[email] Transporte de fallback ativo, email não enviado externamente.",
      {
        to,
        code,
        messageId: info.messageId,
      },
    );
  }

  return {
    usedFallbackTransport: usingFallbackTransport,
    messageId: info.messageId,
  };
}

export async function sendCompanyInviteEmail(input: {
  to: string;
  companyName: string;
  role: "admin" | "viewer";
  inviteUrl: string;
  locale?: "pt" | "en";
}) {
  const fromEmail = process.env.SMTP_FROM_EMAIL!;
  const fromName = process.env.SMTP_FROM_NAME || "Da Vinci";
  const locale = input.locale === "en" ? "en" : "pt";
  const roleLabel =
    locale === "en"
      ? input.role === "admin"
        ? "Admin"
        : "Member"
      : input.role === "admin"
        ? "Admin"
        : "Membro";

  const subject =
    locale === "en"
      ? `Invitation to join ${input.companyName}`
      : `Convite para entrar na empresa ${input.companyName}`;

  const html =
    locale === "en"
      ? `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>You were invited to join ${input.companyName}</h2>
        <p>Your role will be: <strong>${roleLabel}</strong></p>
        <p>Click the button below to accept the invite:</p>
        <p><a href="${input.inviteUrl}" style="display:inline-block;padding:10px 16px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px">Accept invite</a></p>
      </div>
      `
      : `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Foste convidado para entrar na empresa ${input.companyName}</h2>
        <p>O teu papel será: <strong>${roleLabel}</strong></p>
        <p>Clica no botão abaixo para aceitares o convite:</p>
        <p><a href="${input.inviteUrl}" style="display:inline-block;padding:10px 16px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px">Aceitar convite</a></p>
      </div>
      `;

  const text =
    locale === "en"
      ? `You were invited to join ${input.companyName} as ${roleLabel}.\n\nAccept invite: ${input.inviteUrl}`
      : `Foste convidado para entrar na empresa ${input.companyName} como ${roleLabel}.\n\nAceitar convite: ${input.inviteUrl}`;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: input.to,
    subject,
    html,
    text,
  });

  if (usingFallbackTransport) {
    console.warn(
      "[email] Transporte de fallback ativo, convite não enviado externamente.",
      {
        to: input.to,
        inviteUrl: input.inviteUrl,
        messageId: info.messageId,
      },
    );
  }

  return {
    usedFallbackTransport: usingFallbackTransport,
    messageId: info.messageId,
  };
}
