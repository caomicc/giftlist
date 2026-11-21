// Refuses anything that could point local-only tooling (db:reset, e2e) at a real database,
// a remote Docker daemon, or a real mail account. Only the fields passed are checked.
import { LOCAL_DB_HOSTS } from '../lib/local-db.ts'

export { LOCAL_DB_HOSTS }

const isLocalDocker = target => !target || target.startsWith('unix://') || target.startsWith('npipe://')

export function assertLocalTarget({ databaseUrl, dockerHost, dockerEndpoint, emailUser } = {}) {
  if (databaseUrl !== undefined) {
    let host
    try {
      host = new URL(databaseUrl).hostname
    } catch {
      throw new Error(`NEON_DATABASE_URL is missing or not a URL; expected the local database (${LOCAL_DB_HOSTS.join(' or ')}).`)
    }
    if (!LOCAL_DB_HOSTS.includes(host)) {
      throw new Error(`Refusing: database host "${host}" is not local (${LOCAL_DB_HOSTS.join(' or ')}).`)
    }
  }
  if (!isLocalDocker(dockerHost)) {
    throw new Error(`Refusing: DOCKER_HOST="${dockerHost}" points at a remote Docker daemon.`)
  }
  if (!isLocalDocker(dockerEndpoint)) {
    throw new Error(`Refusing: the active docker context points at "${dockerEndpoint}", not this machine.`)
  }
  if (emailUser) {
    throw new Error(`Refusing: EMAIL_SERVER_USER is set ("${emailUser}"), so real email could be sent.`)
  }
}
