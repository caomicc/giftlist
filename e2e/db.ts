import { randomBytes } from 'crypto'
import { neon, neonConfig } from '@neondatabase/serverless'
import { request as playwrightRequest } from '@playwright/test'
import { localFetchEndpoint } from '../lib/local-db'
import { PORT, e2eServerEnv } from './local-env'

/** Direct SQL on the local e2e database (global-setup refuses anything else), for setup no API offers. */
const url = e2eServerEnv.NEON_DATABASE_URL
const endpoint = localFetchEndpoint(url)
if (endpoint) neonConfig.fetchEndpoint = endpoint
export const sql = neon(url)

/** An API client signed in as `userId` through a fresh session row: faster than signing in through the UI. */
export async function apiAs(userId: string) {
  const token = randomBytes(32).toString('hex')
  await sql`INSERT INTO sessions (session_token, user_id, expires) VALUES (${token}, ${userId}, NOW() + INTERVAL '1 hour')`
  return playwrightRequest.newContext({
    baseURL: `http://localhost:${PORT}`,
    extraHTTPHeaders: { Cookie: `session-token=${token}` },
  })
}
