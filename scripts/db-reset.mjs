// npm run db:reset — wipe and re-create the local database (re-runs db/schema.sql + db/seed.sql).
import { execFileSync } from 'node:child_process'
import { assertLocalTarget } from './db-guard.mjs'

// loadEnvFile never overrides variables already set, so an exported production URL is refused below.
process.loadEnvFile('db/local.env')

let dockerEndpoint
try {
  dockerEndpoint = execFileSync('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'], { encoding: 'utf8' }).trim()
} catch {
  console.error('Could not read the docker context. Is Docker running?')
  process.exit(1)
}

try {
  assertLocalTarget({ databaseUrl: process.env.NEON_DATABASE_URL, dockerHost: process.env.DOCKER_HOST, dockerEndpoint })
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

execFileSync('docker', ['compose', 'down', '-v'], { stdio: 'inherit' })
execFileSync('docker', ['compose', 'up', '-d', '--wait'], { stdio: 'inherit' })
