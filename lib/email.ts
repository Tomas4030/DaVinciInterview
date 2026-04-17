import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpHost = (process.env.SMTP_HOST || "").trim();
const usingFallbackTransport = !smtpHost || smtpHost === "localhost" || smtpHost === "127.0.0.1";

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
    console.warn("[email] SMTP indisponível, mensagem gerada em fallback local.", {
      to,
      code,
      messageId: info.messageId,
    });
  }
}
