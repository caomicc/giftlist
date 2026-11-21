"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CURRENCIES } from "@/lib/currency"
import { useTranslation } from "./i18n-provider"

type CurrencySelectProps = {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/** Picks the currency a price or gift-card target is entered in. Sits beside the amount field. */
export default function CurrencySelect({ id, value, onChange, disabled }: CurrencySelectProps) {
  const { t } = useTranslation("gifts")
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-24 shrink-0" aria-label={t.addForm?.labels?.currency || "Currency"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((code) => (
          <SelectItem key={code} value={code}>
            {code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
