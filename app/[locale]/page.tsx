// La home. È la pagina, al singolare: il sito è una sequenza sola, e la
// navigazione è un indice della partitura, non un menu di pagine.
//
// L'ordine delle sezioni non è un elenco di contenuti, è un ritmo. La densità
// dichiarata qui sotto è la stessa verificata allo Step 02, e la regola non
// cambia: non esistono due sezioni consecutive della stessa densità.
//
//   hero          A  5   fotografia piena, densità massima
//   marquee       —  2   frattura
//   famiglia      B  3   editoriale + inserto d'archivio
//   respiro       D  1   tipografica, registro respiro     ← la discesa
//   cantina       D  5   tipografica, registro monumento   ← il punto profondo
//   vino          B  3   editoriale, lato opposto
//   cucina        E  4   griglia asimmetrica + la carta
//   locali        C  3   dittico con occlusione a tre livelli
//   risalita      D  1   tipografica, registro respiro     ← la risalita
//   prenota       —  2   funzionale
//   footer        —  1   tipografica
//
// La cantina è tipografica e non fotografica perché la fotografia dei tunnel
// non esiste: la libreria del cliente è stata setacciata tutta allo Step 02.
// La regola del brief è esplicita — meglio una sezione di sola tipografia ben
// composta che una stock photo toscana — e questa la applica.

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { FOTO } from "@/lib/data/foto";
import { LOCALI, VALUTAZIONE_DA_VERIFICARE } from "@/lib/data/locali";
import { CARTA, CATEGORIE } from "@/lib/data/menu";
import { alternatesFor } from "@/lib/seo";
import { DuotoneDefs } from "@/components/media/DuotoneDefs";
import { AmbientGlow } from "@/components/sections/AmbientGlow";
import { Cucina } from "@/components/sections/Cucina";
import { Descent } from "@/components/sections/Descent";
import { DiptychSection } from "@/components/sections/DiptychSection";
import { EditorialSection } from "@/components/sections/EditorialSection";
import { FullBleedSection } from "@/components/sections/FullBleedSection";
import { Marquee } from "@/components/sections/Marquee";
import { Prenotazione } from "@/components/sections/Prenotazione";
import { TypeSection } from "@/components/sections/TypeSection";
import { LinkAzione } from "@/components/ui/LinkAzione";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { StickyCallBar } from "@/components/chrome/StickyCallBar";
import { VOCI_NAV } from "@/lib/data/navigazione";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { description: t("description"), alternates: alternatesFor("/", locale as Locale) };
}

function Body() {
  const t = useTranslations("home");
  const tf = useTranslations("foto");
  const tc = useTranslations("common");
  const tl = useTranslations("locali");
  const tCarta = useTranslations("carta");
  const em = { em: (chunks: React.ReactNode) => <em>{chunks}</em> };

  const [centoUno, settantaDue] = LOCALI;

  return (
    <>
    <main id="contenuto" className="shell">
      <DuotoneDefs />

      {/* ---------------------------------------------------------- A · hero */}
      <FullBleedSection
        id="hero"
        titoloTesto={t("hero.titolo")}
        accenti={[t("hero.accento")]}
        sommario={
          <>
            {/* Due varianti, non una troncata: con la barra di Safari aperta
                il sommario lungo spinge la prima CTA sotto la piega, e la
                risposta giusta è una frase più corta, non un bottone più
                piccolo. */}
            <span className="md:hidden">{t("hero.sommarioStretto")}</span>
            <span className="hidden md:inline">{t("hero.sommario")}</span>
          </>
        }
        azione={
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Impilate e a piena larghezza sotto sm: due CTA affiancate su
                390px diventano due bersagli stretti e nessuno dei due è
                comodo. */}
            <LinkAzione href="#prenota" size="lg" className="w-full sm:w-auto">
              {t("hero.ctaPrimaria")}
            </LinkAzione>
            <LinkAzione href="#cantina" variant="ghost" size="lg" className="w-full sm:w-auto">
              {t("hero.ctaSecondaria")}
            </LinkAzione>

            {/* La valutazione non è confermata da nessuna fonte: sta dietro a
                una costante sola, così si toglie o si corregge con una riga.
                Vedi DA-VERIFICARE.md. */}
            {VALUTAZIONE_DA_VERIFICARE ? (
              <p className="font-mono text-mono text-cream/85">{t("hero.valutazione")}</p>
            ) : null}
          </div>
        }
        indicatore={t("hero.indicatore")}
        foto={FOTO.salaBancone}
        alt={tf("salaBancone")}
        rapporto="21/9"
        altezza="piena"
        priority
      />

      {/* -------------------------------------------------------- · frattura */}
      <Marquee voci={t("marquee.voci").split("|")} />

      {/* ------------------------------------------------------ B · famiglia */}
      <EditorialSection
        id="famiglia"
        titolo={t.rich("famiglia.titolo", em)}
        testo={
          <>
            <p>{t("famiglia.p1")}</p>
            <p>{t("famiglia.p2")}</p>
            <p>{t("famiglia.p3")}</p>
          </>
        }
        // 4/5 e non il 3/2 nativo: le facce vendono, e un ritratto verticale
        // occupa l'occhio più a lungo di una veduta larga della stessa scena.
        foto={FOTO.squadraInVia}
        alt={tf("squadraInVia")}
        rapporto="4/5"
        lato="start"
        sfasamento="testo"
        colonneImmagine={5}
        inserto={{
          foto: FOTO.archivioErcolani,
          alt: tf("archivioErcolani"),
          rapporto: "3/2",
          didascalia: t("famiglia.didascalia"),
        }}
      />

      {/* ------------------------------ D respiro → D monumento, in un movimento
          Il respiro non finisce per lasciare il posto alla cantina: viene
          mangiato dall'alto MENTRE la cantina sale da sotto. È la discesa. */}
      <Descent
        id="cantina"
        respiro={t.rich("discesa.testo", em)}
        titolo={t("cantina.titolo")}
        sottotesto={t("cantina.sottotesto")}
        // Trattamento primario: la degustazione è il prodotto a margine più
        // alto ed è quello meno promosso oggi.
        azione={<LinkAzione href="#prenota" size="lg">{t("cantina.cta")}</LinkAzione>}
      />

      {/* ---------------------------------------------------------- B · vino */}
      <EditorialSection
        id="vino"
        titolo={t.rich("vino.titolo", em)}
        testo={
          <>
            <p>{t("vino.p1")}</p>
            <p>{t("vino.p2")}</p>
          </>
        }
        foto={FOTO.caliceInciso}
        alt={tf("caliceInciso")}
        rapporto="4/5"
        lato="end"
        sfasamento="testo"
        colonneImmagine={5}
      />

      {/* -------------------------------------------------------- E · cucina */}
      <Cucina id="cucina" />

      {/* -------------------------------------------------------- C · locali */}
      <DiptychSection
        id="locali"
        titolo={t("locali.titolo")}
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

      {/* ------------------------------------------- D · respiro, la risalita */}
      <TypeSection
        registro="respiro"
        testo={t.rich("risalita.testo", em)}
        glow={<AmbientGlow sorgente="ottone" className="right-0 top-[6%] h-[38vh] w-[42vw]" />}
      />

      {/* ------------------------------------------------------ · funzionale */}
      <Prenotazione id="prenota" />

      {/* La carta è un pannello e non ha un indirizzo proprio, ma i piatti
          restano un dato che i motori sanno leggere: il nodo `Menu` vive
          qui, sulla pagina che la carta la contiene davvero. I prezzi non
          compaiono affatto — un `offers` a zero è peggio di nessun `offers`,
          perché Google lo mostra. Vedi DA-VERIFICARE.md §4. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Menu",
            name: tCarta("titolo"),
            hasMenuSection: CATEGORIE.map((categoria) => ({
              "@type": "MenuSection",
              name: tCarta(`categorie.${categoria}`),
              hasMenuItem: CARTA.filter((voce) => voce.categoria === categoria).map((voce) => ({
                "@type": "MenuItem",
                name: tCarta(`piatti.${voce.id}.nome`),
                description: tCarta(`piatti.${voce.id}.descrizione`),
                ...(voce.tag.includes("vegetariano")
                  ? { suitableForDiet: "https://schema.org/VegetarianDiet" }
                  : {}),
              })),
            })),
          }),
        }}
      />
    </main>

    {/* Il footer sta FUORI da `main`: il contenuto principale del documento
        finisce con la prenotazione, e il salto "vai al contenuto" non deve
        includere i dati di chiusura. */}
    <SiteFooter voci={VOCI_NAV} />

    {/* La barra fissa vive solo qui: la sua sentinella è l'hero, e l'hero
        esiste solo su questa pagina. */}
    <StickyCallBar />
    </>
  );
}

export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return <Body />;
}
