// npm run dev — next dev against the local database (db/local.env values override .env).
// Not `node --env-file`: next dev forwards it via NODE_OPTIONS to its workers, which Node rejects.
import { spawn } from 'node:child_process'
import { loadLocalEnv } from './local-env.mjs'

const local = loadLocalEnv()
const child = spawn('next', ['dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, ...local },
  shell: process.platform === 'win32',
})
child.on('exit', code => process.exit(code ?? 0))
