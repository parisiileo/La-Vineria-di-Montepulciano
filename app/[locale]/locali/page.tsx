// Le due sale.
//
// È la pagina che serve la ricerca locale, ed è per questo che porta i dati
// completi invece delle due frasi che stanno in home: indirizzo per esteso,
// telefono proprio di ciascuna sala, stato di apertura e collegamento alle
// mappe. Il 72 ha un numero suo, e mandare tutti sul 101 significa far
// squillare la sala sbagliata.
//
// Il dittico è lo stesso archetipo della home — stessa occlusione a tre
// livelli, stessi civici che escono dal bordo dell'immagine — perché una
// pagina figlia che cambia impaginazione non sembra parte dello stesso sito.

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { FOTO } from "@/lib/data/foto";
import { LOCALI, linkMappe } from "@/lib/data/locali";
import { alternatesFor, restaurantJsonLd } from "@/lib/seo";
import { DiptychSection } from "@/components/sections/DiptychSection";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { StatoAperturaBadge } from "@/components/ui/StatoApertura";
import { LinkAzione } from "@/components/ui/LinkAzione";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "pagine.locali" });
  return {
    title: t("titoloMeta"),
    description: t("descrizioneMeta"),
    alternates: alternatesFor("/locali", locale as Locale),
  };
}

function Body() {
  const t = useTranslations("pagine.locali");
  const tf = useTranslations("foto");
  const tl = useTranslations("locali");
  const tc = useTranslations("common");

  const [centoUno, settantaDue] = LOCALI;

  return (
    <main id="contenuto" className="shell pt-40">
      <header className="section-y pt-0">
        <SplitText as="h1" text={t("titolo")} className="max-w-[15ch] text-hero" delay={0.15} />
        <Reveal delay={0.45}>
          <p className="measure mt-8 text-lead text-stone">{t("sommario")}</p>
        </Reveal>
      </header>

      <DiptychSection
        titolo=""
        primaria={{
          civico: centoUno.civico,
          via: centoUno.via,
          titolo: tl("gracciano101.nome"),
          testo: tl("gracciano101.sommario"),
          tratti: [tl("gracciano101.tratti.cantina"), tl("gracciano101.tratti.tunnel")],
          foto: FOTO.facciata101,
          alt: tf("facciata101"),
          rapporto: "16/9",
          cursore: tc("guarda"),
        }}
        secondaria={{
          civico: settantaDue.civico,
          via: settantaDue.via,
          titolo: tl("gracciano72.nome"),
          testo: tl("gracciano72.sommario"),
          tratti: [tl("gracciano72.tratti.pozzo"), tl("gracciano72.tratti.vetro")],
          foto: FOTO.facciata72,
          alt: tf("facciata72"),
          rapporto: "4/5",
        }}
      />

      <section className="section-y border-t border-border">
        <Reveal>
          <h2 className="text-h2">{t("comeArrivare")}</h2>
        </Reveal>

        <ul className="mt-12 grid gap-12 md:grid-cols-2">
          {LOCALI.map((sede) => {
            const chiave = sede.id === "gracciano-101" ? "gracciano101" : "gracciano72";
            const mappe = linkMappe(sede);
            return (
              <li key={sede.id}>
                <p className="flex items-baseline gap-3">
                  <span className="font-mono text-mono tabular-nums lining-nums text-brass">
                    {sede.civico}
                  </span>
                  <span className="font-display text-h3 text-cream">{tl(`${chiave}.nome`)}</span>
                </p>
                <p className="mt-3 text-body text-stone">
                  {sede.via} {sede.civico}, {sede.cap} {sede.citta} ({sede.provincia})
                </p>
                <p className="mt-1">
                  <a
                    href={sede.telefonoHref}
                    className="underline-grow relative font-mono text-mono text-stone"
                  >
                    {sede.telefono}
                  </a>
                </p>
                <StatoAperturaBadge orari={sede.orari} className="mt-4" />
                <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  <a
                    href={mappe.google}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline-grow relative font-sans text-label uppercase text-brass"
                  >
                    Google Maps
                    <span className="sr-only"> {tc("nuovaScheda")}</span>
                  </a>
                  <a
                    href={mappe.apple}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline-grow relative font-sans text-label uppercase text-brass"
                  >
                    Apple Maps
                    <span className="sr-only"> {tc("nuovaScheda")}</span>
                  </a>
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-16">
          <LinkAzione href="/#prenota" size="lg">
            {t("cta")}
          </LinkAzione>
        </div>
      </section>

      {/* Un nodo per sede, non uno per l'attività: sono due indirizzi e due
          numeri, e Google li tratta come due schede. `openingHours` e `geo`
          restano fuori finché il cliente non li conferma. */}
      {LOCALI.map((sede) => (
        <script
          key={sede.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              restaurantJsonLd(
                sede,
                tl(sede.id === "gracciano-101" ? "gracciano101.nome" : "gracciano72.nome"),
              ),
            ),
          }}
        />
      ))}
    </main>
  );
}

export default async function LocaliPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return <Body />;
}
