import type { Metadata } from "next";
import { type Locale, getAllDictionaries } from "@/lib/i18n";
import { locales } from "@/lib/i18n-config";
import { UserMenuWrapper } from "@/components/user-menu-wrapper";
import { I18nProvider } from "@/components/i18n-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ThemeProvider } from "@/components/theme-provider";
import { seasonScript } from "@/lib/seasons";

export const metadata: Metadata = {
  title: "Meep Family Wishlist",
  description: "Share gift ideas with your family and quietly coordinate who's getting what.",
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const translations = await getAllDictionaries(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.style.fontFamily};
            --font-mono: ${GeistMono.style.fontFamily};
          }
        `}
        </style>
        <script dangerouslySetInnerHTML={{ __html: seasonScript }} />
      </head>

      <body className={"bg-linear-to-br from-backdrop-from to-backdrop-to min-h-screen"}>
        <ThemeProvider
          attribute="data-theme"
          themes={['light', 'dark', 'seasonal-light', 'seasonal-dark']}
          defaultTheme="light"
          enableSystem={false}
          enableColorScheme={false}
          disableTransitionOnChange
        >
        <I18nProvider locale={lang} translations={translations}>
          <ConfirmProvider>
            {/* One row, aligned with the content column, in normal flow (nothing overlaps the page below) */}
            <header className="relative z-50 mx-auto flex h-16 max-w-xl items-center justify-between px-4 md:px-0">
              <LocaleSwitcher />
              <UserMenuWrapper />
            </header>
            <div className="relative z-10">{children}</div>
          </ConfirmProvider>
          <Toaster position="bottom-center" richColors closeButton />
        </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
