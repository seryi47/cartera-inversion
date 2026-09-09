import { Resend } from "resend";

// Con la cuenta gratuita de Resend (sin dominio propio verificado), su remitente
// de pruebas "onboarding@resend.dev" solo permite mandar al email con el que te
// registraste en Resend — es la limitación normal del plan gratis, no un bug.
const FROM = process.env.RESEND_FROM || "Cartera de Inversión <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] Falta RESEND_API_KEY — no se puede enviar el email de restablecimiento.");
    return { ok: false, reason: "missing_api_key" as const };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Restablecer tu contraseña — Cartera de Inversión",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Restablecer tu contraseña</h2>
        <p style="color: #334155;">Has pedido restablecer la contraseña de tu Cartera de Inversión. Este enlace caduca en 1 hora.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
            Elegir nueva contraseña
          </a>
        </p>
        <p style="color: #64748b; font-size: 13px;">
          Si no has sido tú, ignora este email — tu contraseña actual sigue funcionando igual.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Error enviando con Resend:", error);
    return { ok: false, reason: "send_failed" as const };
  }
  return { ok: true as const };
}
