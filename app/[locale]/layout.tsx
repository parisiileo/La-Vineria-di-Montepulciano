// Documento localizzato: lingua, font, colore di sistema, grana e contratto
// di movimento. Il fondo è tufo dal primo byte: nessun flash bianco possibile.

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/app/fonts";
import { Grain } from "@/components/Grain";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { Cursor } from "@/components/chrome/Cursor";
import { PageTransition } from "@/components/chrome/PageTransition";
import { Navbar } from "@/components/chrome/Navbar";
import { VOCI_BARRA, VOCI_NAV } from "@/lib/data/navigazione";
import { MotionBootScript } from "@/components/MotionRuntime";
import { MotionReady } from "@/components/MotionReady";
import { HREFLANG, SITE_URL, alternatesFor } from "@/lib/seo";
import { THEME_COLOR } from "@/lib/utils";
import "@/app/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    alternates: alternatesFor("/", locale as Locale),
    openGraph: {
      type: "website",
      siteName: t("title"),
      title: t("title"),
      description: t("description"),
      locale: HREFLANG[locale as keyof typeof HREFLANG],
    },
  };
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={HREFLANG[locale]} className={fontVariables} suppressHydrationWarning>
      <head>
        <MotionBootScript />
      </head>
      <body className="bg-tuff text-stone antialiased">
        <a
          href="#contenuto"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:start-4 focus-visible:top-4 focus-visible:z-(--z-overlay) focus-visible:rounded-sm focus-visible:bg-wine focus-visible:px-4 focus-visible:py-3 focus-visible:text-cream"
        >
          {t("skipToContent")}
        </a>

        <NextIntlClientProvider>
          <MotionReady />
          <SmoothScroll />
          {/* La barra è figlia diretta del body e non di `main`: dentro `main`
              vivono i parallassi, e un antenato con `transform` disattiva in
              silenzio il `backdrop-filter` del velo. */}
          <Navbar voci={VOCI_NAV} barra={VOCI_BARRA} />
          {props.children}
          <Cursor />
          <PageTransition />
        </NextIntlClientProvider>

        <Grain />
      </body>
    </html>
  );
}
