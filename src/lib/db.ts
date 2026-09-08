import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL — revisa las variables de entorno de Neon");
}

export const sql = neon(process.env.DATABASE_URL);
