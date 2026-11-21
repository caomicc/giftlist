import { LOCAL_DB_HOSTS } from '../scripts/db-guard.mjs'

/**
 * The Neon HTTP endpoint for a local database URL, or undefined to keep the driver default.
 * Always localhost: some DNS resolvers refuse db.localtest.me (it points at 127.0.0.1).
 */
export function localFetchEndpoint(databaseUrl: string): string | undefined {
  try {
    return LOCAL_DB_HOSTS.includes(new URL(databaseUrl).hostname) ? 'http://localhost:4444/sql' : undefined
  } catch {
    return undefined
  }
}
