import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Usa DIRECT_URL para migraciones (requerido para Supabase)
    // Si no existe DIRECT_URL, usa DATABASE_URL como fallback
    url: (process.env.DIRECT_URL || process.env.DATABASE_URL) as string,
  },
});
