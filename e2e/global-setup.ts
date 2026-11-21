import { assertLocalTarget } from '../scripts/db-guard.mjs'
import { e2eServerEnv } from './local-env'

export default async function globalSetup() {
  assertLocalTarget({ databaseUrl: e2eServerEnv.NEON_DATABASE_URL, emailUser: e2eServerEnv.EMAIL_SERVER_USER })
  try {
    await fetch('http://localhost:4444')
  } catch {
    throw new Error('Local database proxy not reachable on :4444. Run: npm run db:up')
  }
}
