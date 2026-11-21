import test from 'node:test'
import assert from 'node:assert/strict'
import { assertLocalTarget } from './db-guard.mjs'

test('accepts the local database and local docker', () => {
  assert.doesNotThrow(() => assertLocalTarget({ databaseUrl: 'postgres://postgres:postgres@db.localtest.me:5432/main', dockerHost: undefined, dockerEndpoint: 'unix:///var/run/docker.sock', emailUser: '' }))
  assert.doesNotThrow(() => assertLocalTarget({ databaseUrl: 'postgres://u:p@localhost:5433/main' }))
})

test('rejects a non-local database host', () => {
  assert.throws(() => assertLocalTarget({ databaseUrl: 'postgres://u:p@ep-x.us-east-2.aws.neon.tech/neondb' }), /ep-x\.us-east-2\.aws\.neon\.tech/)
})

test('rejects a missing or unparsable database URL', () => {
  assert.throws(() => assertLocalTarget({ databaseUrl: '' }), /NEON_DATABASE_URL/)
  assert.throws(() => assertLocalTarget({ databaseUrl: 'not a url' }), /NEON_DATABASE_URL/)
})

test('rejects a remote docker target', () => {
  assert.throws(() => assertLocalTarget({ dockerHost: 'tcp://10.0.0.5:2376' }), /DOCKER_HOST/)
  assert.throws(() => assertLocalTarget({ dockerEndpoint: 'ssh://deploy@prod-box' }), /docker context/)
})

test('rejects mail sending being configured', () => {
  assert.throws(() => assertLocalTarget({ emailUser: 'someone@gmail.com' }), /EMAIL_SERVER_USER/)
})
