// npm run dev — next dev against the local database (db/local.env values override .env).
// Not `node --env-file`: next dev forwards it via NODE_OPTIONS to its workers, which Node rejects.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

const local = parseEnv(readFileSync('db/local.env', 'utf8'))
const child = spawn('next', ['dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, ...local },
  shell: process.platform === 'win32',
})
child.on('exit', code => process.exit(code ?? 0))
