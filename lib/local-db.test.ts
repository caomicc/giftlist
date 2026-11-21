import test from 'node:test'
import assert from 'node:assert/strict'
import { localFetchEndpoint } from './local-db.ts'

test('local database URLs go to the Neon proxy on localhost:4444', () => {
  assert.equal(localFetchEndpoint('postgres://postgres:postgres@db.localtest.me:5432/main'), 'http://localhost:4444/sql')
  assert.equal(localFetchEndpoint('postgres://postgres:postgres@localhost:5432/main'), 'http://localhost:4444/sql')
})

test('any other URL keeps the driver default', () => {
  assert.equal(localFetchEndpoint('postgres://u:p@ep-x.us-east-2.aws.neon.tech/neondb'), undefined)
  assert.equal(localFetchEndpoint('not a url'), undefined)
})
