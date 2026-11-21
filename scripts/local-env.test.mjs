import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseLocalEnv } from './local-env.mjs'

const ok = 'NEON_DATABASE_URL=postgres://postgres:postgres@db.localtest.me:5432/main\nEMAIL_SERVER_USER=\nRAPID_API_KEY=\nNEXTAUTH_URL=http://localhost:3000\n'

test('accepts the committed db/local.env', () => {
  const env = parseLocalEnv(readFileSync('db/local.env', 'utf8'))
  assert.equal(env.EMAIL_SERVER_USER, '')
  assert.equal(env.RAPID_API_KEY, '')
})

test('requires outside services to be switched off explicitly', () => {
  for (const key of ['EMAIL_SERVER_USER', 'RAPID_API_KEY']) {
    const missing = ok.split('\n').filter(l => !l.startsWith(`${key}=`)).join('\n')
    assert.throws(() => parseLocalEnv(missing), new RegExp(`${key}.*missing`))
    assert.throws(() => parseLocalEnv(ok.replace(`${key}=`, `${key}=real-value`)), new RegExp(key))
  }
})

test('rejects a non-local database', () => {
  assert.throws(() => parseLocalEnv(ok.replace('db.localtest.me', 'ep-x.neon.tech')), /ep-x\.neon\.tech/)
})
