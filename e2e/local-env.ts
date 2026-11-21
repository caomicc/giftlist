import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

export const PORT = 3100

/** Env for the e2e `next dev`: db/local.env (local DB, no mail) — process env beats Next's .env loading. */
export const e2eServerEnv: Record<string, string> = {
  ...(parseEnv(readFileSync('db/local.env', 'utf8')) as Record<string, string>),
  NEXTAUTH_URL: `http://localhost:${PORT}`,
  NEXT_DIST_DIR: '.next-e2e',
}
