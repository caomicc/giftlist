'use client'

import { useEffect, useState } from 'react'
import { Bot, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfirm } from './confirm-dialog'
import { useTranslation, formatMessage } from './i18n-provider'

interface AgentToken {
  id: string
  name: string
  created_at: string
}

/**
 * Agent tokens let Claude Code, Hermes or another MCP client use the site as you, through /api/mcp.
 * A new token is shown once, with the commands that connect each agent.
 */
export function AgentAccess() {
  const { t: tProfile, locale } = useTranslation('profile')
  const t = tProfile.agentAccess || {}
  const confirm = useConfirm()
  const [tokens, setTokens] = useState<AgentToken[]>([])
  const [name, setName] = useState('')
  const [newToken, setNewToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/user/tokens')
      .then(res => (res.ok ? res.json() : { tokens: [] }))
      .then(data => setTokens(data.tokens))
      .catch(() => {})
  }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/user/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error()
      const { token, ...row } = await res.json()
      setNewToken(token)
      setTokens(prev => [row, ...prev])
      setName('')
    } catch {
      toast.error(t.createError || 'Couldn’t create a token. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (token: AgentToken) => {
    const ok = await confirm({
      title: formatMessage(t.revokeTitle || 'Revoke “{{name}}”?', { name: token.name }),
      description: t.revokeBody || 'Any agent using this token loses access right away.',
      confirmLabel: t.revoke || 'Revoke',
    })
    if (!ok) return
    const res = await fetch(`/api/user/tokens?id=${token.id}`, { method: 'DELETE' })
    if (res.ok) {
      setTokens(prev => prev.filter(x => x.id !== token.id))
      toast.success(t.revoked || 'Token revoked')
    } else {
      toast.error(t.revokeError || 'Couldn’t revoke the token. Try again.')
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t.copied || 'Copied')
    } catch {
      toast.error(t.copyError || 'Couldn’t copy. Select the text and copy it instead.')
    }
  }

  // Only rendered after a click creates a token, so window exists
  const mcpUrl = newToken ? `${window.location.origin}/api/mcp` : ''
  const claudeCommand = `claude mcp add --transport http giftlist ${mcpUrl} --header "Authorization: Bearer ${newToken}"`
  const hermesConfig = `mcp_servers:\n  giftlist:\n    url: "${mcpUrl}"\n    headers:\n      Authorization: "Bearer ${newToken}"`

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Bot className="size-5" aria-hidden="true" />
          {t.title || 'Agent access'}
        </CardTitle>
        <CardDescription>
          {t.body || 'Let an AI agent such as Claude Code or Hermes act as you: read the family’s lists, add gifts to yours and claim gifts. A token works for a year.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={create} className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="agent-token-name">{t.nameLabel || 'Token name'}</Label>
            <Input
              id="agent-token-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.namePlaceholder || 'e.g. Claude Code on my laptop'}
              className="mt-1"
              maxLength={100}
            />
          </div>
          <Button type="submit" disabled={busy}>{t.create || 'Create token'}</Button>
        </form>

        {newToken && (
          <div className="space-y-3 rounded-md border border-primary/40 bg-primary/5 p-3">
            <p className="text-sm font-medium">{t.copyNow || 'Copy this token now. It won’t be shown again.'}</p>
            <Snippet label={t.tokenLabel || 'Token'} text={newToken} onCopy={copy} copyLabel={t.copy || 'Copy'} />
            <Snippet label={t.claudeCode || 'Claude Code: run this in a terminal'} text={claudeCommand} onCopy={copy} copyLabel={t.copy || 'Copy'} />
            <Snippet label={t.hermes || 'Hermes: add this to ~/.hermes/config.yaml'} text={hermesConfig} onCopy={copy} copyLabel={t.copy || 'Copy'} />
          </div>
        )}

        {tokens.length > 0 && (
          <ul className="divide-y rounded-md border" aria-label={t.listLabel || 'Your agent tokens'}>
            {tokens.map(token => (
              <li key={token.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{token.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMessage(t.createdOn || 'Created {{date}}', {
                      date: new Date(token.created_at).toLocaleDateString(locale),
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revoke(token)}
                  aria-label={formatMessage(t.revokeLabel || 'Revoke {{name}}', { name: token.name })}
                >
                  {t.revoke || 'Revoke'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function Snippet({ label, text, onCopy, copyLabel }: { label: string; text: string; onCopy: (text: string) => void; copyLabel: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => onCopy(text)} aria-label={`${copyLabel}: ${label}`}>
          <Copy className="size-3.5" aria-hidden="true" />
          {copyLabel}
        </Button>
      </div>
      <pre className="overflow-x-auto whitespace-pre rounded bg-muted p-2 text-xs">{text}</pre>
    </div>
  )
}
