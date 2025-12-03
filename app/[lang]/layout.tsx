import type { Metadata } from "next";
import { type Locale, getAllDictionaries } from "@/lib/i18n";
import { locales } from "@/lib/i18n-config";
import { UserMenuWrapper } from "@/components/user-menu-wrapper";
import { I18nProvider } from "@/components/i18n-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

export const metadata: Metadata = {
  title: "Meep Family Wishlist",
  description: "Hi",
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
    <html lang={lang}>
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
        `}
        </style>
      </head>

      <body className={"bg-gradient-to-br from-red-100 to-violet-300 min-h-screen"}>
        <I18nProvider locale={lang} translations={translations}>
          <div className="absolute top-4 left-4 z-50">
            <LocaleSwitcher />
          </div>
          <UserMenuWrapper />
          <div className="relative z-10">{children}</div>
          <div
            className={
              "absolute h-[50vh] bg-white block md:hidden bottom-0 left-0 right-0 z-1 w-full"
            }
          ></div>
        </I18nProvider>
      </body>
    </html>
  );
}
