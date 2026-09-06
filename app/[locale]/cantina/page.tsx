// La visita in cantina.
//
// È la prima pagina che non è la home, e la ragione non è editoriale ma
// commerciale: «visita cantina Montepulciano» è una domanda diversa da
// «ristorante Montepulciano», e una pagina sola non può rispondere a
// entrambe. È anche il prodotto a margine più alto della casa, promosso oggi
// da una sola CTA in mezzo a una pagina lunga.
//
// La pagina è tipografica e non fotografica, come la sezione da cui nasce:
// le fotografie delle gallerie non esistono ancora. L'unica immagine è la
// facciata del 101, e la didascalia dice che è l'ingresso e non la cantina —
// mostrare una porta lasciando credere che sia un tunnel è la stessa bugia
// di una stock photo, solo più economica.

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { FOTO } from "@/lib/data/foto";
import { LOCALI, SOTTOSUOLO, TELEFONO, TELEFONO_HREF } from "@/lib/data/locali";
import { alternatesFor } from "@/lib/seo";
import { Figure } from "@/components/media/Figure";
import { RevealImage } from "@/components/media/RevealImage";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { LinkAzione } from "@/components/ui/LinkAzione";
import { BottoneCarta } from "@/components/sections/BottoneCarta";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "pagine.cantina" });
  return {
    title: t("titoloMeta"),
    description: t("descrizioneMeta"),
    alternates: alternatesFor("/cantina", locale as Locale),
  };
}

function Body() {
  const t = useTranslations("pagine.cantina");
  const tf = useTranslations("foto");
  const [centoUno] = LOCALI;

  return (
    <main id="contenuto" className="shell pt-40">
      <header className="section-y pt-0">
        <Reveal>
          <p className="w-fit font-mono text-mono uppercase text-brass">{t("occhiello")}</p>
        </Reveal>
        <SplitText as="h1" text={t("titolo")} className="mt-6 max-w-[15ch] text-hero" delay={0.15} />
        <Reveal delay={0.6}>
          <p className="measure mt-8 text-lead text-stone">{t("sommario")}</p>
        </Reveal>
      </header>

      {/* La sala del 101, non la facciata. La facciata è un dehors in pieno
          giorno: la fotografia più chiara del corpus, e su una pagina che
          parla di gallerie fresche e buie diventava il soggetto sbagliato
          nel tono sbagliato. La sala è il punto da cui si scende davvero. */}
      <RevealImage>
        <Figure
          foto={FOTO.salaPareteBottiglie}
          alt={tf("salaPareteBottiglie")}
          rapporto="21/9"
          sizes="(max-width: 768px) 100vw, 90rem"
          priority
          didascalia={t("dettaglio")}
        />
      </RevealImage>

      <div className="grid-editorial section-y">
        <Reveal className="col-span-12 md:col-span-5">
          <h2 className="text-h2">{t("cosaTitolo")}</h2>
        </Reveal>
        <Reveal className="col-span-12 space-y-6 md:col-span-6 md:col-start-7" delay={0.08}>
          <p className="measure text-body text-stone">{t("cosaP1")}</p>
          <p className="measure text-body text-stone">{t("cosaP2")}</p>
        </Reveal>
      </div>

      <div className="grid-editorial section-y border-t border-border">
        <Reveal className="col-span-12 md:col-span-5">
          <h2 className="text-h2">{t("perchéTitolo")}</h2>
        </Reveal>
        <Reveal className="col-span-12 space-y-6 md:col-span-6 md:col-start-7" delay={0.08}>
          <p className="measure text-body text-stone">{t("perchéP1")}</p>
          <p className="measure text-body text-stone">{t("perchéP2")}</p>
        </Reveal>
      </div>

      {/* Spezza una pagina che senza sarebbe cinque blocchi di testo in
          fila, e sta a metà, dove il lettore comincia a stancarsi.
          NON è la parete di bottiglie, che pure sarebbe più vicina al
          soggetto: in quello scatto c'è un cartello «FREE SHIPPING ON ALL
          OUR PRODUCTS». Su una pagina che parla di gallerie medievali è
          fuori tono, e soprattutto annuncia un servizio che non sappiamo se
          esiste — una fotografia può fare una promessa quanto una frase.
          16/9 perché è un ripiano lungo una parete: è il rapporto della
          stanza, non del soggetto. */}
      <div className="grid-editorial">
        <RevealImage className="col-span-12 md:col-span-7 md:col-start-6">
          <Figure
            foto={FOTO.caliciSulRipiano}
            alt={tf("caliciSulRipiano")}
            rapporto="16/9"
            sizes="(max-width: 768px) 100vw, 55vw"
          />
        </RevealImage>
      </div>

      <div className="grid-editorial section-y border-t border-border">
        <Reveal className="col-span-12 md:col-span-5">
          <h2 className="text-h2">{t("visitaTitolo")}</h2>
        </Reveal>
        <Reveal className="col-span-12 md:col-span-6 md:col-start-7" delay={0.08}>
          <p className="measure text-body text-stone">{t("visitaP1")}</p>
          <p className="measure mt-6 text-body text-stone">{t("visitaP2")}</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <LinkAzione href="/#prenota" size="lg" className="w-full sm:w-auto">
              {t("cta")}
            </LinkAzione>
            <p className="font-sans text-mono text-stone-dim">
              {t("chiama")}{" "}
              <a href={TELEFONO_HREF} className="underline-grow relative text-brass">
                {TELEFONO}
              </a>
            </p>
          </div>
        </Reveal>
      </div>

      {/* Quattro righe pratiche, non un elenco di caratteristiche. Sono le
          conseguenze dei fatti che conosciamo — una scala vera, il tufo che
          resta fresco — e sono le sole risposte che possiamo dare senza
          inventare durata, prezzo e accessibilità. */}
      <section className="section-y border-t border-border">
        <Reveal>
          <h2 className="text-h2">{t("primaTitolo")}</h2>
        </Reveal>
        <Reveal className="mt-10" staggerChildren="tight">
          <ul className="grid gap-x-(--grid-gap) gap-y-6 md:grid-cols-2">
            {(["primaScala", "primaFresco", "primaScarpe", "primaOrario"] as const).map((k) => (
              <RevealItem as="li" key={k} className="border-t border-border pt-4">
                <p className="measure text-body text-stone">{t(k)}</p>
              </RevealItem>
            ))}
          </ul>
        </Reveal>
      </section>

      <div className="grid-editorial section-y border-t border-border">
        <Reveal className="col-span-12 md:col-span-5">
          <h2 className="text-h2">{t("vinoTitolo")}</h2>
        </Reveal>
        <Reveal className="col-span-12 md:col-span-6 md:col-start-7" delay={0.08}>
          <p className="measure text-body text-stone">{t("vinoP1")}</p>
          {/* La carta è un pannello: si apre, non si va. */}
          <BottoneCarta etichetta={t("vinoCta")} className="mt-8" />
        </Reveal>
      </div>

      <div className="grid-editorial section-y border-t border-border">
        <Reveal className="col-span-12 md:col-span-5">
          <h2 className="text-h2">{t("fineTitolo")}</h2>
        </Reveal>
        <Reveal className="col-span-12 md:col-span-6 md:col-start-7" delay={0.08}>
          <p className="measure text-body text-stone">{t("fineP1")}</p>
          <LinkAzione href="/locali" variant="ghost" size="lg" className="mt-8">
            {t("fineCta")}
          </LinkAzione>
        </Reveal>
      </div>

      {/* `TouristAttraction` e non `Restaurant`: qui l'oggetto della pagina è
          la visita, non la tavola. `isAccessibleForFree` resta fuori finché
          il cliente non conferma se il percorso è gratuito. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: t("titoloMeta"),
            description: t("descrizioneMeta"),
            telephone: TELEFONO,
            publicAccess: SOTTOSUOLO.tunnelVisitabili,
            address: {
              "@type": "PostalAddress",
              streetAddress: `${centoUno.via}, ${centoUno.civico}`,
              postalCode: centoUno.cap,
              addressLocality: centoUno.citta,
              addressRegion: centoUno.provincia,
              addressCountry: centoUno.paese,
            },
          }),
        }}
      />
    </main>
  );
}

export default async function CantinaPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return <Body />;
}
