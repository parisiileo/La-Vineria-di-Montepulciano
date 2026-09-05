// ARCHETIPO C — dittico.
//
// Due elementi affiancati di peso diverso, non due card gemelle. Due riquadri
// identici si leggono come un elenco; due pesi diversi si leggono come una
// scelta, e una scelta è ciò che rende una composizione tale.
//
// Qui vive anche l'occlusione a tre livelli, che è la tecnica di profondità
// più forte del sito:
//
//   sotto   il filetto e l'etichetta in mono, che il bordo dell'immagine taglia
//   mezzo   la fotografia
//   sopra   il numero civico a --t-display in ottone, che esce dal bordo
//           dell'immagine e continua sul fondo tufo
//
// Tre piani visibili in un colpo d'occhio, senza una riga di WebGL.
//
// Impiego: i due locali, 101 e 72.

import type { Foto } from "@/lib/data/foto";
import { Figure, type Rapporto } from "@/components/media/Figure";
import { RevealImage } from "@/components/media/RevealImage";
import { Reveal } from "@/components/motion/Reveal";
import { SectionNumber } from "@/components/sections/SectionNumber";
import { cn } from "@/lib/utils";

export interface AnteDittico {
  /** Il numero che sborda. In mono nei dati, in display quando è protagonista. */
  civico: string;
  /** Via, in mono: è il filetto che passa sotto la fotografia. */
  via: string;
  titolo: React.ReactNode;
  testo: React.ReactNode;
  /** Tratti confermati dal cliente. Nessuno è inventato: vedi lib/data/locali. */
  tratti?: readonly string[];
  foto: Foto;
  alt: string;
  rapporto: Rapporto;
}

export interface DiptychSectionProps {
  id?: string;
  numero: string;
  etichetta: string;
  titolo: React.ReactNode;
  sommario?: React.ReactNode;
  /** L'anta grande: 7 colonne, il civico che sborda, il peso della sezione. */
  primaria: AnteDittico;
  /** L'anta piccola: 4 colonne, scende, e non prova a pareggiare la prima. */
  secondaria: AnteDittico;
  className?: string;
}

function Tratti({ voci }: { voci: readonly string[] }) {
  return (
    <ul className="mt-6 space-y-2">
      {voci.map((voce) => (
        <li key={voce} className="flex items-baseline gap-3 font-sans text-label uppercase text-stone-dim">
          <span aria-hidden="true" className="h-px w-3 shrink-0 translate-y-[-0.3em] bg-brass-dim" />
          {voce}
        </li>
      ))}
    </ul>
  );
}

export function DiptychSection({
  id,
  numero,
  etichetta,
  titolo,
  sommario,
  primaria,
  secondaria,
  className,
}: DiptychSectionProps) {
  return (
    <section id={id} className={cn("section-y", className)}>
      <Reveal direction="up">
        <SectionNumber numero={numero} titolo={etichetta} className="mb-6" />
        <h2 className="max-w-[16ch] text-h2">{titolo}</h2>
        {sommario ? <p className="mt-6 max-w-[46ch] text-lead text-stone">{sommario}</p> : null}
      </Reveal>

      <div className="grid-editorial mt-20 items-start">
        {/* ---------------------------------------------------- anta grande */}
        <div className="col-span-12 md:col-span-7">
          {/* I tre livelli vivono in questo contenitore e non nella colonna:
              ancorati alla colonna, che comprende anche il testo sotto, il
              numero finirebbe in fondo al paragrafo senza toccare nulla.
              È esattamente l'errore che questa sezione aveva. */}
          <div className="relative">
            {/* Livello 1 — passa SOTTO: parte dentro l'immagine, che ne
                nasconde l'inizio, e riemerge sul tufo alla sua destra. */}
            <div
              aria-hidden="true"
              className="absolute left-[34%] right-[-34%] top-[14%] z-0 hidden items-center gap-4 md:flex"
            >
              <span className="h-px flex-1 bg-brass-dim" />
              <span className="whitespace-nowrap font-mono text-mono uppercase text-stone-dim">
                {primaria.via}
              </span>
            </div>

            {/* Livello 2 — la fotografia. */}
            <RevealImage className="relative z-10">
              <Figure
                foto={primaria.foto}
                alt={primaria.alt}
                rapporto={primaria.rapporto}
                sizes="(max-width: 768px) 100vw, 58vw"
              />
            </RevealImage>

            {/* Livello 3 — passa SOPRA: esce dal bordo basso dell'immagine e
                continua sul tufo. Il valore di `bottom` è stato calibrato
                guardando, non calcolando: le cifre di Cormorant sono di
                default minuscole (oldstyle) e il loro inchiostro sta molto
                più in basso della scatola di riga, quindi ogni valore
                calcolato sulle metriche sbagliava il segno. Le cifre sono
                state portate a `lining-nums` — un civico è una targa, non una
                parola — e l'offset calibrato a vista finché circa un terzo
                del glifo non è finito dentro la fotografia.

                Limite noto: nella fotografia che il cliente possiede oggi
                l'angolo in basso a sinistra è selciato chiaro, e l'ottone lì
                sopra perde contrasto. Spostare il numero a un terzo della
                base lo rende più leggibile ma gli toglie l'ancoraggio
                all'angolo, che è la ragione per cui sta lì: provato e
                scartato. La correzione vera è uno scatto con l'angolo basso
                in ombra, ed è una richiesta per il servizio fotografico, non
                una toppa da CSS. Il numero è `aria-hidden`: il civico è
                comunque scritto in chiaro sotto. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[0.18em] left-0 z-20 -translate-x-[0.07em] font-display text-hero leading-[0.7] text-brass [font-variant-numeric:lining-nums]"
            >
              {primaria.civico}
            </span>
          </div>

          <div className="mt-20 max-w-[46ch]">
            <Reveal direction="up">
              <h3 className="text-h3">{primaria.titolo}</h3>
              <p className="mt-4 text-body text-stone">{primaria.testo}</p>
              {primaria.tratti ? <Tratti voci={primaria.tratti} /> : null}
            </Reveal>
          </div>
        </div>

        {/* ---------------------------------------------------- anta piccola */}
        <div className="col-span-12 mt-16 md:col-span-4 md:col-start-9 md:mt-[16vh]">
          <RevealImage delay={0.1}>
            <Figure
              foto={secondaria.foto}
              alt={secondaria.alt}
              rapporto={secondaria.rapporto}
              sizes="(max-width: 768px) 100vw, 30vw"
            />
          </RevealImage>

          <Reveal direction="up" className="mt-8">
            <p className="font-mono text-mono uppercase text-brass">{secondaria.civico}</p>
            <h3 className="mt-3 text-h3">{secondaria.titolo}</h3>
            <p className="mt-4 text-body text-stone">{secondaria.testo}</p>
            {secondaria.tratti ? <Tratti voci={secondaria.tratti} /> : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
