import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),
  migrate: {
    async url() {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required for migrations')
      }
      return databaseUrl
    }
  }
})
