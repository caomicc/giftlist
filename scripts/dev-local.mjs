// npm run dev — next dev against the local database (db/local.env values override .env).
// Not `node --env-file`: next dev forwards it via NODE_OPTIONS to its workers, which Node rejects.
import { spawn } from 'node:child_process'
import os from 'node:os'
import { loadLocalEnv } from './local-env.mjs'

const local = loadLocalEnv()
const child = spawn('next', ['dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, ...local },
  shell: process.platform === 'win32',
})
child.on('error', error => {
  console.error(`Could not start next dev (${error.message}). Run it via npm run dev so node_modules/.bin is on PATH.`)
  process.exit(1)
})
// Killed by a signal → conventional 128 + signal number, so callers see a failure.
child.on('exit', (code, signal) => process.exit(code ?? 128 + (os.constants.signals[signal] ?? 0)))
