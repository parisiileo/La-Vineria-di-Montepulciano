// L'unico modo in cui una fotografia entra in questo sito.
//
// Nessuna immagine è usata a proporzione nativa "perché è così che è": il
// rapporto è una prop obbligatoria, scelta per la composizione. Il grading,
// il pavimento delle ombre e il velo di temperatura sono in globals.css:
// qui c'è solo la struttura dei tre strati.

import Image from "next/image";

import type { Foto } from "@/lib/data/foto";
import { cn } from "@/lib/utils";

/**
 * Rapporti ammessi, con il loro impiego dichiarato. Un elenco chiuso: se
 * servisse un sesto rapporto è probabile che il problema sia la composizione.
 *
 *  4/5   ritratti e dettagli — più intimo, occupa l'occhio in verticale
 *  16/9  ambienti — il rapporto della stanza
 *  1/1   celle di griglia — nessuna cella prevale per forma, solo per scala
 *  21/9  fasce full-bleed — la fessura orizzontale, il taglio più cinematico
 *  3/2   nativo del corpus (2048×1366): l'unico "non ritaglio", e va motivato
 */
export type Rapporto = "4/5" | "16/9" | "1/1" | "21/9" | "3/2";

const RAPPORTO: Record<Rapporto, string> = {
  "4/5": "aspect-[4/5]",
  "16/9": "aspect-[16/9]",
  "1/1": "aspect-square",
  "21/9": "aspect-[21/9]",
  "3/2": "aspect-[3/2]",
};

export interface FigureProps {
  foto: Foto;
  /** Testo alternativo già tradotto: il componente non conosce l'i18n. */
  alt: string;
  /** Obbligatorio: ogni ritaglio di questo progetto è una decisione. */
  rapporto: Rapporto;
  /** `sizes` di next/image. Senza, il browser scarica sempre il massimo. */
  sizes: string;
  /** Solo per l'immagine sopra la piega: una per pagina, non tre. */
  priority?: boolean;
  /** Gradiente di leggibilità per il testo sovrapposto in basso. */
  leggibilita?: boolean;
  /** Riempie il contenitore invece di imporre il proprio rapporto. */
  riempi?: boolean;
  className?: string;
  /** Didascalia visibile. Assente per default: quasi sempre è rumore. */
  didascalia?: React.ReactNode;
  /**
   * Etichetta mostrata dentro l'anello del cursore custom. Solo dove la
   * fotografia è davvero il soggetto: un'etichetta su ogni immagine si
   * trasforma in rumore che segue il mouse.
   */
  cursore?: string;
}

export function Figure({
  foto,
  alt,
  rapporto,
  sizes,
  priority = false,
  leggibilita = false,
  riempi = false,
  className,
  didascalia,
  cursore,
}: FigureProps) {
  const archivio = foto.registro === "archivio";

  return (
    <figure className={cn("relative m-0", className)} data-cursore={cursore}>
      {/* `isolate` chiude il contesto di fusione: lo strato in `lighten` deve
          incontrare la fotografia, mai la parete che ci sta dietro. */}
      <div
        className={cn(
          "relative isolate overflow-hidden bg-tuff-deep",
          riempi ? "size-full" : RAPPORTO[rapporto],
        )}
        style={
          {
            "--fuoco": foto.fuoco,
            "--fuoco-stretto": foto.fuocoStretto ?? foto.fuoco,
          } as React.CSSProperties
        }
      >
        <Image
          src={foto.src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder="blur"
          className={cn(
            "size-full object-cover",
            archivio ? "foto-archivio" : "foto-grade",
            "[object-position:var(--fuoco-stretto)] md:[object-position:var(--fuoco)]",
          )}
        />
        <div aria-hidden="true" className="foto-lift absolute inset-0" />
        <div aria-hidden="true" className="foto-velo absolute inset-0" />
        {leggibilita ? (
          <div aria-hidden="true" className="foto-leggibilita absolute inset-0" />
        ) : null}
      </div>

      {didascalia ? (
        <figcaption className="mt-3 font-mono text-mono text-stone-dim">{didascalia}</figcaption>
      ) : null}
    </figure>
  );
}
