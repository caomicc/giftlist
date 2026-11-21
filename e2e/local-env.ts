import { loadLocalEnv } from '../scripts/local-env.mjs'

export const PORT = 3100

/** Env for the e2e `next dev`: db/local.env (local DB, no mail) — process env beats Next's .env loading. */
export const e2eServerEnv: Record<string, string> = {
  ...(loadLocalEnv() as Record<string, string>),
  NEXTAUTH_URL: `http://localhost:${PORT}`,
  NEXT_DIST_DIR: '.next-e2e',
}
