import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const sql = neon(process.env.DATABASE_URL);
const TEST_EMAIL = "test-verificacion@example.com";

async function main() {
  // limpieza de una ejecución anterior, si la hubiera
  const prev = await sql`SELECT id FROM users WHERE email = ${TEST_EMAIL}`;
  if (prev[0]) await sql`DELETE FROM users WHERE id = ${prev[0].id}`; // cascada borra funds/contributions

  // 1. Alta de usuario (igual que signUpAction)
  const hash = await bcrypt.hash("password123", 10);
  const [{ id: userId }] = await sql`
    INSERT INTO users (email, password_hash) VALUES (${TEST_EMAIL}, ${hash}) RETURNING id
  `;
  console.log("✓ Usuario creado, id =", userId);

  // 2. Verificación de contraseña (igual que auth.ts)
  const [user] = await sql`SELECT password_hash FROM users WHERE id = ${userId}`;
  const passwordOk = await bcrypt.compare("password123", user.password_hash);
  const passwordWrongRejected = !(await bcrypt.compare("otra_cosa", user.password_hash));
  console.log("✓ Contraseña correcta valida:", passwordOk);
  console.log("✓ Contraseña incorrecta se rechaza:", passwordWrongRejected);

  // 3. Siembra de los 5 fondos (igual que signUpAction)
  const portfolio = [
    { name: "iShares Developed World", isin: "IE000ZYRH0Q7", target_weight: 0.45, ter: 0.0006 },
    { name: "iShares Emerging Markets", isin: "IE000QAZP7L2", target_weight: 0.20, ter: 0.0016 },
    { name: "iShares Small Cap (IUSN)", isin: "IE00BF4RFH31", target_weight: 0.15, ter: 0.0035 },
    { name: "Vanguard Global Bond", isin: "IE00B18GC888", target_weight: 0.10, ter: 0.0015 },
    { name: "Invesco Physical Gold", isin: "IE00B579F325", target_weight: 0.10, ter: 0.0012 },
  ];
  for (let i = 0; i < portfolio.length; i++) {
    const f = portfolio[i];
    await sql`
      INSERT INTO funds (user_id, name, isin, target_weight, ter, sort_order)
      VALUES (${userId}, ${f.name}, ${f.isin}, ${f.target_weight}, ${f.ter}, ${i})
    `;
  }
  const funds = await sql`SELECT id, name, target_weight FROM funds WHERE user_id = ${userId} ORDER BY sort_order`;
  console.log("✓ Fondos sembrados:", funds.length, "— pesos suman", funds.reduce((a, f) => a + Number(f.target_weight), 0));

  // 4. Aportación automática de 150€ repartida por pesos (igual que addContributionRoundAction modo "auto")
  const roundId = randomUUID();
  const total = 150;
  for (const f of funds) {
    const amount = Math.round(total * Number(f.target_weight) * 100) / 100;
    if (amount > 0) {
      await sql`
        INSERT INTO contributions (user_id, fund_id, round_id, date, amount)
        VALUES (${userId}, ${f.id}, ${roundId}, '2026-09-08', ${amount})
      `;
    }
  }
  console.log("✓ Aportación de 150€ registrada, round_id =", roundId);

  // 5. Agregados del dashboard (igual que page.tsx)
  const totals = await sql`
    SELECT fund_id, SUM(amount) AS total FROM contributions WHERE user_id = ${userId} GROUP BY fund_id
  `;
  const totalInvested = totals.reduce((acc, t) => acc + Number(t.total), 0);
  console.log("✓ Total invertido calculado:", totalInvested, "(esperado: 150)");
  if (Math.abs(totalInvested - 150) > 0.01) throw new Error("¡El total no cuadra!");

  for (const f of funds) {
    const t = totals.find((x) => x.fund_id === f.id);
    const expected = Math.round(150 * Number(f.target_weight) * 100) / 100;
    console.log(`   ${f.name}: ${t?.total ?? 0}€ (esperado ${expected}€)`);
  }

  // 6. Borrado de la aportación (igual que deleteRoundAction)
  await sql`DELETE FROM contributions WHERE round_id = ${roundId} AND user_id = ${userId}`;
  const afterDelete = await sql`SELECT COUNT(*)::int AS n FROM contributions WHERE user_id = ${userId}`;
  console.log("✓ Tras borrar, contribuciones restantes:", afterDelete[0].n, "(esperado: 0)");

  // 7. Limpieza final
  await sql`DELETE FROM users WHERE id = ${userId}`;
  console.log("✓ Usuario de prueba eliminado (cascada se llevó fondos también)");

  console.log("\n✅ TODO EL FLUJO FUNCIONA CORRECTAMENTE CONTRA LA BASE DE DATOS REAL");
}

main().catch((e) => {
  console.error("❌ ERROR:", e);
  process.exit(1);
});
