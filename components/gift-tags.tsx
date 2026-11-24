'use client'

import { Flag, Tag } from 'lucide-react'
import type { Priority } from '@/lib/neon'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useTranslation } from './i18n-provider'

const PRIORITIES: Priority[] = ['high', 'medium', 'low']
const PRIORITY_FALLBACK = { high: 'High', medium: 'Medium', low: 'Low' }

/**
 * A gift's priority and category. High priority stands out in plain dark text with a filled flag:
 * the colored badges already mean something (violet is a group gift).
 */
export function GiftTagBadges({ category, priority, className }: {
  category?: string | null
  priority?: Priority | null
  className?: string
}) {
  const { t } = useTranslation('gifts')
  const high = priority === 'high'
  return (
    <>
      {priority && (
        <Badge variant="outline" className={cn(high ? 'text-foreground border-foreground/40' : 'text-muted-foreground', className)}>
          <Flag className={cn('w-3 h-3 mr-0.5', high && 'fill-current')} aria-hidden="true" />
          {t.giftItem?.badges?.priority?.[priority] || `${PRIORITY_FALLBACK[priority]} priority`}
        </Badge>
      )}
      {category && (
        <Badge variant="outline" className={cn('text-muted-foreground', className)}>
          <Tag className="w-3 h-3 mr-0.5" aria-hidden="true" />
          {category}
        </Badge>
      )}
    </>
  )
}

/** Category and priority inputs, shared by the add form and the edit dialog. */
export function GiftTagFields({ idPrefix, category, priority, onCategoryChange, onPriorityChange, disabled, optional }: {
  idPrefix: string
  category: string
  priority: Priority | 'none'
  onCategoryChange: (value: string) => void
  onPriorityChange: (value: Priority | 'none') => void
  disabled?: boolean
  /** "optional" hint after each label, as the add form shows */
  optional?: string
}) {
  const { t } = useTranslation('gifts')
  const tForm = t.addForm || {}
  const hint = optional && <span className="font-normal text-muted-foreground">({optional})</span>
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-category`}>{tForm.labels?.category || 'Category'} {hint}</Label>
        <Input
          id={`${idPrefix}-category`}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder={tForm.placeholders?.category || 'e.g. Kitchen'}
          maxLength={50}
          autoComplete="off"
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-priority`}>{tForm.labels?.priority || 'Priority'} {hint}</Label>
        <Select value={priority} onValueChange={(value) => onPriorityChange(value as Priority | 'none')} disabled={disabled}>
          <SelectTrigger id={`${idPrefix}-priority`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{tForm.priorities?.none || 'No priority'}</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{tForm.priorities?.[p] || PRIORITY_FALLBACK[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
