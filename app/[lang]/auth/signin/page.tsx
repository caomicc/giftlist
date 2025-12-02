import { LoginForm } from "@/components/login-form"
import { type Locale, getDictionary } from '@/lib/i18n'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const [common, auth] = await Promise.all([
    getDictionary(lang, 'common'),
    getDictionary(lang, 'auth'),
  ])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10 dark:bg-zinc-800">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm locale={lang} translations={{ common, auth }} />
      </div>
    </div>
  )
}
