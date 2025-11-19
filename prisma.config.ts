import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_2nmfAb9SVBcO@ep-quiet-glitter-adhaxx8r-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  },
});
