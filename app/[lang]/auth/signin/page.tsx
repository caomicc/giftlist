import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { getSession } from "@/lib/auth"

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  // Already signed in (a session that really exists, not just a cookie): go to the lists
  if (await getSession()) {
    const { lang } = await params
    redirect(`/${lang}`)
  }

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  )
}
