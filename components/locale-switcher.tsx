"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "./i18n-provider";
import { locales } from "@/lib/i18n-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const localeNames: Record<string, string> = {
  en: "English",
  ru: "Русский",
};

const localeFlags: Record<string, string> = {
  en: "🇺🇸",
  ru: "🇷🇺",
};

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useI18n();

  const handleLocaleChange = (newLocale: string) => {
    // Get the current path without the locale prefix
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

    // Build the new path with the new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;

    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;

    // Navigate to the new path
    router.push(newPath);
    router.refresh();
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[140px] shadow-none border-0">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <div className="flex row items-center gap-2 [&>span]:inline-block">
              <span>
                {localeNames[loc]}
              </span>
              <span>{localeFlags[loc]}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
