// La visita in cantina.
//
// È la prima pagina che non è la home, e la ragione non è editoriale ma
// commerciale: «visita cantina Montepulciano» è una domanda diversa da
// «ristorante Montepulciano», e una pagina sola non può rispondere a
// entrambe. È anche il prodotto a margine più alto della casa, promosso oggi
// da una sola CTA in mezzo a una pagina lunga.
//
// L'apertura è la sequenza: 205 fotogrammi della discesa, legati allo scroll,
// con tre blocchi di testo ancorati a tre fasce di progresso. Sostituisce
// l'intestazione tipografica che stava qui, e la sostituisce per la ragione
// per cui la pagina esiste: chi cerca «visita cantina» sta cercando di sapere
// com'è là sotto, e nessun titolo glielo dice come glielo dice il tunnel.
//
// Il corpo della pagina resta quello che era — tipografico, con una sola
// fotografia e la didascalia che dice che è la sala e non le gallerie. Il
// sommario che apriva la pagina apre ora la prima sezione editoriale: senza
// il titolo, che ora sta nella sequenza, ma con lo stesso testo, che è quello
// che i motori di ricerca leggono.

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { FOTO } from "@/lib/data/foto";
import { LOCALI, SOTTOSUOLO, TELEFONO, TELEFONO_HREF } from "@/lib/data/locali";
import { HREFLANG, alternatesFor } from "@/lib/seo";
import { Figure } from "@/components/media/Figure";
import { RevealImage } from "@/components/media/RevealImage";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { LinkAzione } from "@/components/ui/LinkAzione";
import { BottoneCarta } from "@/components/sections/BottoneCarta";
import {
  SequenzaCantina,
  PRIMO_FOTOGRAMMA,
  type BloccoSequenza,
} from "@/components/sections/SequenzaCantina";


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "pagine.cantina" });
  const titolo = t("titoloMeta");
  const descrizione = t("descrizioneMeta");
  // L'URL della pagina lo costruisce `alternatesFor`, che sa dei percorsi
  // tradotti: `/en/cantina` esiste solo come redirect, e una card social che
  // punta a un redirect è una card che alcuni scraper non seguono.
  const alternates = alternatesFor("/cantina", locale as Locale);

  return {
    title: titolo,
    description: descrizione,
    alternates,
    openGraph: {
      type: "article",
      url: alternates?.canonical as string,
      title: titolo,
      description: descrizione,
      locale: HREFLANG[locale as Locale],
      // La cartolina della cantina è il tunnel, non la sala: chi condivide
      // questa pagina sta condividendo la visita. La compone
      // `npm run cartoline` a 1200×630 — prima qui c'era un rimando diretto a
      // `/cellar/100.webp`, un 16:9 non ritagliato e senza trattamento, che le
      // piattaforme tagliavano dove capitava.
      images: [
        {
          url: "/og/cantina.jpg",
          width: 1200,
          height: 630,
          alt: t("ogAlt"),
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

function Body() {
  const t = useTranslations("pagine.cantina");
  const tf = useTranslations("foto");
  const [centoUno] = LOCALI;
  const em = { em: (chunks: React.ReactNode) => <em>{chunks}</em> };

  // Le tre fasce non si toccano: fra 0.30 e 0.35 non c'è nessun testo in scena,
  // ed è voluto. È il momento in cui si guarda soltanto la galleria — senza
  // quella pausa i tre blocchi si leggerebbero come una lista, non come tre
  // momenti separati da un tratto di strada.
  const blocchi: BloccoSequenza[] = [
    {
      titolo: t.rich("seqTitolo1", em),
      sottotitolo: t("seqTesto1"),
      fascia: [0, 0.3],
    },
    {
      titolo: t.rich("seqTitolo2", em),
      sottotitolo: t("seqTesto2"),
      fascia: [0.35, 0.65],
    },
    {
      titolo: t.rich("seqTitolo3", em),
      sottotitolo: t("seqTesto3"),
      fascia: [0.7, 1],
    },
  ];

  return (
    <main id="contenuto">
      {/* Il primo fotogramma è l'unico che l'utente aspetta davvero: viene
          chiesto dal documento, non dallo script, così parte durante il parsing
          e non dopo l'idratazione. Gli altri 204 li accoda il componente. */}
      <link rel="preload" as="image" href={PRIMO_FOTOGRAMMA} fetchPriority="high" />

      <SequenzaCantina blocchi={blocchi} descrizione={t("sequenzaDescrizione")} />

      <div className="shell">
        {/* L'occhiello «Ingresso dal 101» che stava qui sopra non c'è più.
            Non era sbagliato — era un appoggio: una riga piccola in ottone che
            annunciava il titolo invece di lasciarglielo fare. Il dato che
            portava non è andato perduto, lo dice per esteso «Come funziona»
            più in basso, dove serve davvero a chi sta decidendo se venire.

            Al suo posto, il titolo fa il titolo. È tornato un `h2` vero e non
            un paragrafo travestito, ha l'accento in ottone sull'ultima parola
            — che è il verbo, cioè la promessa della pagina — e prende l'aria
            che prima si divideva con la riga sopra. */}
        <header className="section-y">
          <SplitText
            as="h2"
            text={t("titolo")}
            accentWords={[t("accento")]}
            className="max-w-[15ch] text-h2"
            delay={0.1}
          />
          <Reveal delay={0.5}>
            <p className="measure mt-10 text-lead text-stone">{t("sommario")}</p>
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
