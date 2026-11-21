// The one way to read db/local.env. Refuses a file that doesn't explicitly switch outside services off:
// a missing line would let Next fill the value from .env (production Gmail / paid RapidAPI key).
import { parseEnv } from 'node:util'
import { readFileSync } from 'node:fs'
import { assertLocalTarget } from './db-guard.mjs'

const MUST_BE_EMPTY = ['EMAIL_SERVER_USER', 'RAPID_API_KEY']

export function parseLocalEnv(text) {
  const env = parseEnv(text)
  for (const key of MUST_BE_EMPTY) {
    if (!(key in env)) throw new Error(`db/local.env: ${key} is missing; it must be present and empty (${key}=).`)
    if (env[key] !== '') throw new Error(`db/local.env: ${key} must be empty, so local runs never use the real service.`)
  }
  assertLocalTarget({ databaseUrl: env.NEON_DATABASE_URL })
  return env
}

export const loadLocalEnv = () => parseLocalEnv(readFileSync('db/local.env', 'utf8'))
