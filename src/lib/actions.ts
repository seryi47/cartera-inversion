"use server";

import { sql } from "@/lib/db";
import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { DEFAULT_PORTFOLIO } from "@/lib/default-portfolio";
import { AuthError } from "next-auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { getFundPriceEur } from "@/lib/fund-price";

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }
    throw e;
  }

  redirect("/");
}

export async function signUpAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || password.length < 6) {
    return { error: "Email no válido o contraseña demasiado corta (mínimo 6 caracteres)." };
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  const hash = await bcrypt.hash(password, 10);
  const inserted = await sql`
    INSERT INTO users (email, password_hash) VALUES (${email}, ${hash}) RETURNING id
  `;
  const userId = inserted[0].id as number;

  for (let i = 0; i < DEFAULT_PORTFOLIO.length; i++) {
    const f = DEFAULT_PORTFOLIO[i];
    await sql`
      INSERT INTO funds (user_id, name, isin, target_weight, ter, sort_order)
      VALUES (${userId}, ${f.name}, ${f.isin}, ${f.target_weight}, ${f.ter}, ${i})
    `;
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Cuenta creada, pero el inicio de sesión automático falló. Entra manualmente." };
    }
    throw e;
  }

  redirect("/");
}

async function resolvePriceForDate(isin: string, date: string): Promise<number | null> {
  const todayUtc = new Date().toISOString().slice(0, 10);

  // Aportación de "hoy" (o de "hoy" en la hora local del usuario, que puede ir
  // por delante del UTC del servidor cerca de medianoche): usamos el precio EN
  // VIVO, no el del último cron, que puede ser de anoche y no reflejar el precio
  // en el momento exacto en que se mete el dinero.
  if (date >= todayUtc) {
    try {
      return await getFundPriceEur(isin);
    } catch (e) {
      console.error(`[resolvePriceForDate] precio en vivo falló para ${isin}, uso el histórico más reciente:`, e);
    }
  }

  // fecha pasada (o el precio en vivo falló): precio más reciente conocido en o antes de esa fecha
  const rows = await sql`
    SELECT price_eur FROM price_history
    WHERE isin = ${isin} AND date <= ${date}
    ORDER BY date DESC LIMIT 1
  `;
  if (rows[0]) return Number(rows[0].price_eur);

  // sin histórico para esa fecha (p.ej. fondo recién añadido) — probamos el precio en vivo
  try {
    return await getFundPriceEur(isin);
  } catch (e) {
    console.error(`[resolvePriceForDate] no pude resolver precio para ${isin}:`, e);
    return null;
  }
}

export async function addContributionRoundAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = Number((session.user as { id: string }).id);

  const date = String(formData.get("date") || "");
  const mode = String(formData.get("mode") || "auto");
  const roundId = randomUUID();

  if (!date) return { error: "Falta la fecha." };

  const funds = await sql`
    SELECT id, isin, target_weight FROM funds WHERE user_id = ${userId} ORDER BY sort_order
  `;

  if (mode === "auto") {
    const total = Number(formData.get("total") || 0);
    if (!total || total <= 0) return { error: "Importe total no válido." };
    for (const f of funds) {
      const amount = Math.round(total * Number(f.target_weight) * 100) / 100;
      if (amount > 0) {
        const price = f.isin ? await resolvePriceForDate(f.isin as string, date) : null;
        await sql`
          INSERT INTO contributions (user_id, fund_id, round_id, date, amount, price_at_purchase)
          VALUES (${userId}, ${f.id}, ${roundId}, ${date}, ${amount}, ${price})
        `;
      }
    }
  } else {
    // modo manual: un importe por fondo, campos "amount_<fund_id>"
    for (const f of funds) {
      const raw = formData.get(`amount_${f.id}`);
      const amount = Number(raw || 0);
      if (amount > 0) {
        const price = f.isin ? await resolvePriceForDate(f.isin as string, date) : null;
        await sql`
          INSERT INTO contributions (user_id, fund_id, round_id, date, amount, price_at_purchase)
          VALUES (${userId}, ${f.id}, ${roundId}, ${date}, ${amount}, ${price})
        `;
      }
    }
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteRoundAction(roundId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = Number((session.user as { id: string }).id);

  await sql`DELETE FROM contributions WHERE round_id = ${roundId} AND user_id = ${userId}`;
  revalidatePath("/");
}

export async function updateFundWeightAction(fundId: number, weight: number) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = Number((session.user as { id: string }).id);

  if (!Number.isFinite(weight) || weight < 0 || weight > 1) return;

  await sql`
    UPDATE funds SET target_weight = ${weight}
    WHERE id = ${fundId} AND user_id = ${userId}
  `;
  revalidatePath("/");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Introduce un email." };

  // Respuesta siempre igual exista o no la cuenta, para no filtrar qué emails están registrados.
  const generic = { ok: true as const, message: "Si ese email tiene cuenta, te hemos mandado un enlace para restablecer la contraseña." };

  const rows = await sql`SELECT id FROM users WHERE email = ${email}`;
  const user = rows[0];
  if (!user) return generic;

  const token = randomUUID() + randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
  `;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password/${token}`;
  const result = await sendPasswordResetEmail(email, resetUrl);

  if (!result.ok) {
    console.error("[forgotPasswordAction] no se pudo enviar el email:", result.reason);
  }

  return generic;
}

export async function resetPasswordAction(_prevState: unknown, formData: FormData) {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");

  if (!token) return { error: "Enlace no válido." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const rows = await sql`
    SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ${token}
  `;
  const record = rows[0];
  if (!record) return { error: "Enlace no válido o ya usado." };
  if (record.used_at) return { error: "Este enlace ya se usó. Pide uno nuevo." };
  if (new Date(record.expires_at as string) < new Date()) return { error: "Este enlace ha caducado. Pide uno nuevo." };

  const hash = await bcrypt.hash(password, 10);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${record.user_id}`;
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE id = ${record.id}`;

  redirect("/login?reset=ok");
}
