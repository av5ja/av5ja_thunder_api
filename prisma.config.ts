import { defineConfig } from 'prisma/config'

// The Worker uses the D1 driver adapter at runtime (src/utils/prisma.ts); this
// URL is a placeholder so the Prisma CLI can render SQLite SQL for
// `prisma migrate diff --from-empty --to-schema` (used to produce D1 migrations).
// It is never opened as a real database.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: 'file:./dev.db'
  }
})
