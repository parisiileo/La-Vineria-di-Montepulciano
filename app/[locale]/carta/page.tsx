// La carta, come pagina.
//
// Esisteva solo dentro un pannello, e un pannello non ha un URL: non si
// condivide su WhatsApp, non si manda a chi deve decidere dove cenare, e
// nessun motore di ricerca lo apre. «Menu» è la domanda numero uno di chi
// sceglie un ristorante dal telefono, ed è l'unica a cui il sito non sapeva
// rispondere con un indirizzo.
//
// Il pannello resta dov'era: sono due lavori diversi. Il pannello è lo
// sguardo veloce mentre si legge la sezione della cucina, la pagina è la
// destinazione. L'elenco è lo stesso componente, quindi un prezzo cambia in
// un posto solo.

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { CARTA } from "@/lib/data/menu";
import { alternatesFor } from "@/lib/seo";
import { ListaCarta } from "@/components/sections/ListaCarta";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { LinkAzione } from "@/components/ui/LinkAzione";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "pagine.carta" });
  return {
    title: t("titoloMeta"),
    description: t("descrizioneMeta"),
    alternates: alternatesFor("/carta", locale as Locale),
  };
}

function Body() {
  const t = useTranslations("pagine.carta");
  const tc = useTranslations("carta");

  return (
    <main id="contenuto" className="shell pt-40">
      <header className="section-y pt-0">
        <SplitText as="h1" text={t("titolo")} className="max-w-[15ch] text-hero" delay={0.15} />
        <Reveal delay={0.45}>
          <p className="measure mt-8 text-lead text-stone">{t("sommario")}</p>
        </Reveal>
      </header>

      {/* Due colonne sopra i 1024px. `break-inside-avoid` sulle sezioni tiene
          insieme categoria e piatti: una carta in cui «Primi» sta in fondo a
          una colonna e i primi cominciano nell'altra non è impaginata, è
          traboccata. */}
      <ListaCarta classeFiltri="mb-16" classeGruppi="lg:columns-2 lg:gap-16" />

      <div className="section-y border-t border-border">
        <LinkAzione href="/#prenota" size="lg">
          {t("cta")}
        </LinkAzione>
      </div>

      {/* I prezzi non ci sono, e nello schema non compaiono affatto: un
          `offers` con prezzo zero è peggio di nessun `offers`, perché Google
          lo mostra. Vedi DA-VERIFICARE.md §4. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Menu",
            name: t("titolo"),
            description: t("descrizioneMeta"),
            hasMenuSection: [
              {
                "@type": "MenuSection",
                name: t("titolo"),
                hasMenuItem: CARTA.map((voce) => ({
                  "@type": "MenuItem",
                  name: tc(`piatti.${voce.id}.nome`),
                  description: tc(`piatti.${voce.id}.descrizione`),
                  ...(voce.tag.includes("vegetariano")
                    ? { suitableForDiet: "https://schema.org/VegetarianDiet" }
                    : {}),
                })),
              },
            ],
          }),
        }}
      />
    </main>
  );
}

export default async function CartaPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return <Body />;
}
