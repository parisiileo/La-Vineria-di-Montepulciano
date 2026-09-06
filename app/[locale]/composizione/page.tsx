// Pagina di prova dello Step 02. Non è parte del sito pubblico: è la partitura
// dei cinque archetipi, montata con le fotografie reali del cliente.
//
// L'ordine non è casuale. La densità visiva di ogni sezione è dichiarata qui
// sotto, e la regola è una sola: non esistono due sezioni consecutive della
// stessa densità. Le due sezioni tipografiche in registro `respiro` sono la
// discesa e la risalita — il verticale del concetto, tradotto in ritmo invece
// che in movimento di camera. Ragionamento completo in DESIGN_NOTES §10.1.
//
//   hero          A  5   fotografia piena, densità massima
//   marquee       —  2   frattura
//   01 famiglia   B  3   editoriale + inserto d'archivio
//   respiro       D  1   tipografica, registro respiro     ← la discesa
//   02 cantina    D  5   tipografica, registro monumento   ← il punto profondo
//   03 vino       B  3   editoriale, lato opposto
//   04 cucina     E  4   griglia asimmetrica
//   05 locali     C  3   dittico con occlusione a tre livelli
//   risalita      D  1   tipografica, registro respiro     ← la risalita
//   prenota       —  2   funzionale
//   footer        —  1   tipografica

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { routing } from "@/i18n/routing";
import { FOTO } from "@/lib/data/foto";
import { LOCALI, TELEFONO, TELEFONO_HREF } from "@/lib/data/locali";
import { DuotoneDefs } from "@/components/media/DuotoneDefs";
import { AmbientGlow } from "@/components/sections/AmbientGlow";
import { AsymmetricGrid } from "@/components/sections/AsymmetricGrid";
import { DiptychSection } from "@/components/sections/DiptychSection";
import { EditorialSection } from "@/components/sections/EditorialSection";
import { FullBleedSection } from "@/components/sections/FullBleedSection";
import { Marquee } from "@/components/sections/Marquee";
import { Descent } from "@/components/sections/Descent";
import { TypeSection } from "@/components/sections/TypeSection";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "composizione" });
  // Pagina di lavoro: fuori dall'indice, come la kitchen-sink.
  return { title: t("titolo"), robots: { index: false, follow: false } };
}

function Body() {
  const t = useTranslations("composizione");
  const tf = useTranslations("foto");
  const tc = useTranslations("common");
  const tl = useTranslations("locali");
  const em = { em: (chunks: React.ReactNode) => <em>{chunks}</em> };
  const br = { br: () => <br /> };

  const [centoUno, settantaDue] = LOCALI;

  return (
    <main id="contenuto" className="shell">
      <DuotoneDefs />

      {/* ---------------------------------------------------------- A · hero */}
      <FullBleedSection
        numero=""
        etichetta={t("hero.occhiello")}
        titoloTesto={t("hero.titoloPiano")}
        accenti={[t("hero.accento")]}
        sommario={t("hero.sommario")}
        dato={t("hero.dato")}
        indicatore={t("hero.indicatore")}
        foto={FOTO.salaBancone}
        alt={tf("salaBancone")}
        rapporto="21/9"
        altezza="piena"
        priority
      />

      {/* ------------------------------------------------------- · frattura */}
      <Marquee voci={t("marquee.voci").split("|")} />

      {/* ------------------------------------------------------ B · famiglia */}
      <EditorialSection
        id="famiglia"
        numero={t("famiglia.numero")}
        etichetta={t("famiglia.etichetta")}
        titolo={t.rich("famiglia.titolo", em)}
        testo={
          <>
            <p>{t("famiglia.p1")}</p>
            <p>{t("famiglia.p2")}</p>
          </>
        }
        dato={t("famiglia.dato")}
        foto={FOTO.squadraInVia}
        alt={tf("squadraInVia")}
        rapporto="3/2"
        lato="start"
        sfasamento="testo"
        inserto={{
          foto: FOTO.archivioErcolani,
          alt: tf("archivioErcolani"),
          rapporto: "3/2",
          didascalia: t("famiglia.didascalia"),
        }}
      />

      {/* ----------------------------- D respiro → D monumento, in una discesa
          Le due sezioni della partitura sono diventate un solo movimento: il
          respiro non finisce e poi comincia la cantina, il respiro viene
          mangiato dall'alto MENTRE la cantina sale da sotto. È la discesa. */}
      <Descent
        id="cantina"
        respiro={t.rich("respiro.testo", { ...em, ...br })}
        numero={t("cantina.numero")}
        etichetta={t("cantina.etichetta")}
        titolo={t.rich("cantina.titolo", { ...em, ...br })}
        sottotesto={t("cantina.sottotesto")}
        dato={t("cantina.dato")}
      />

      {/* ---------------------------------------------------------- B · vino */}
      <EditorialSection
        id="vino"
        numero={t("vino.numero")}
        etichetta={t("vino.etichetta")}
        titolo={t.rich("vino.titolo", em)}
        testo={
          <>
            <p>{t("vino.p1")}</p>
            <p>{t("vino.p2")}</p>
          </>
        }
        dato={t("vino.dato")}
        foto={FOTO.caliceInciso}
        alt={tf("caliceInciso")}
        rapporto="4/5"
        lato="end"
        sfasamento="testo"
        colonneImmagine={5}
      />

      {/* -------------------------------------------------------- E · cucina */}
      <AsymmetricGrid
        id="cucina"
        numero={t("cucina.numero")}
        etichetta={t("cucina.etichetta")}
        titolo={t("cucina.titolo")}
        testo={t("cucina.testo")}
        dominante={{
          foto: FOTO.taglieroAffettati,
          alt: tf("taglieroAffettati"),
          rapporto: "3/2",
        }}
        secondarie={[
          {
            foto: FOTO.pecoriniEMarmellate,
            alt: tf("pecoriniEMarmellate"),
            rapporto: "4/5",
            didascalia: t("cucina.d1"),
          },
          { foto: FOTO.pastaFattaAMano, alt: tf("pastaFattaAMano"), rapporto: "1/1" },
          {
            foto: FOTO.maniAlBancone,
            alt: tf("maniAlBancone"),
            rapporto: "16/9",
            didascalia: t("cucina.d3"),
          },
        ]}
      />

      {/* -------------------------------------------------------- C · locali */}
      <DiptychSection
        id="locali"
        numero={t("locali.numero")}
        etichetta={t("locali.etichetta")}
        titolo={t("locali.titolo")}
        sommario={t("locali.sommario")}
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
      <section id="prenota" className="section-y border-t border-border">
        <div className="grid-editorial items-baseline">
          <div className="col-span-12 md:col-span-5">
            <p className="font-mono text-mono uppercase text-brass">{t("prenota.etichetta")}</p>
            <h2 className="mt-6 text-h3">{t("prenota.titolo")}</h2>
          </div>
          <div className="col-span-12 mt-8 md:col-span-6 md:col-start-7 md:mt-0">
            <p className="measure text-body text-stone">{t("prenota.testo")}</p>
            <a
              href={TELEFONO_HREF}
              className="underline-grow relative mt-6 inline-block font-display text-h3 text-cream"
            >
              {TELEFONO}
            </a>
            <p className="mt-4 font-sans text-label uppercase text-stone-dim">
              {tc("oraiNonDisponibili")}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- · footer */}
      <footer className="grid gap-8 border-t border-border py-12 sm:grid-cols-3">
        {LOCALI.map((sede) => (
          <div key={sede.id}>
            <p className="font-sans text-label uppercase text-stone-dim">
              {tl(sede.id === "gracciano-101" ? "gracciano101.nome" : "gracciano72.nome")}
            </p>
            <p className="mt-2 text-body text-stone">
              {sede.via} <span className="font-mono text-brass">{sede.civico}</span>
            </p>
            <p className="text-body text-stone-dim">
              {sede.cap} {sede.citta} ({sede.provincia})
            </p>
          </div>
        ))}
        <div>
          <p className="font-sans text-label uppercase text-stone-dim">{tc("telefono")}</p>
          <a
            href={TELEFONO_HREF}
            className="underline-grow relative mt-2 inline-block font-mono text-mono text-brass"
          >
            {TELEFONO}
          </a>
        </div>
      </footer>
    </main>
  );
}

export default async function ComposizionePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return <Body />;
}
