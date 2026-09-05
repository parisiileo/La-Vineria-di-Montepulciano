// ARCHETIPO A — piena immagine.
//
// Una fotografia a tutta larghezza e testo minimo sovrapposto in basso a
// sinistra. È la densità massima della partitura, e per questo il testo deve
// essere quasi niente: se sopra una fotografia a tutto schermo c'è un
// paragrafo, il protagonista sono due e la sezione non ha più gerarchia.
//
// Impiego: hero, aperture di sezione.

import type { Foto } from "@/lib/data/foto";
import { Figure, type Rapporto } from "@/components/media/Figure";
import { RevealImage } from "@/components/media/RevealImage";
import { Parallax, ParallaxShift } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { SectionNumber } from "@/components/sections/SectionNumber";
import { cn } from "@/lib/utils";

export interface FullBleedSectionProps {
  id?: string;
  /** Numerazione della partitura. Assente sull'hero: l'hero non è una voce. */
  numero?: string;
  /** Titoletto della numerazione, in mono. */
  etichetta?: string;
  /** Il protagonista. Un solo elemento a --t-hero o --t-h2, mai due. */
  titolo: React.ReactNode;
  /** Una riga, non un paragrafo. */
  sommario?: React.ReactNode;
  /** Dato documentario in mono: civico, annata, indirizzo. */
  dato?: React.ReactNode;
  azione?: React.ReactNode;
  foto: Foto;
  alt: string;
  rapporto: Rapporto;
  /** `piena` per l'hero, `alta` per le aperture interne. */
  altezza?: "piena" | "alta";
  priority?: boolean;
  /** Intensità del parallasse sull'immagine. Il testo va sempre più lento. */
  parallasse?: number;
  className?: string;
}

export function FullBleedSection({
  id,
  numero,
  etichetta,
  titolo,
  sommario,
  dato,
  azione,
  foto,
  alt,
  rapporto,
  altezza = "alta",
  priority = false,
  parallasse = 1,
  className,
}: FullBleedSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "full-bleed relative isolate flex items-end overflow-hidden",
        altezza === "piena" ? "min-h-[88svh]" : "min-h-[72svh]",
        className,
      )}
    >
      <div className="absolute inset-0">
        <Parallax className="size-full" intensity={parallasse}>
          <RevealImage className="size-full">
            <Figure
              foto={foto}
              alt={alt}
              rapporto={rapporto}
              riempi
              priority={priority}
              leggibilita
              sizes="100vw"
              className="size-full"
            />
          </RevealImage>
        </Parallax>
      </div>

      {/* Il testo si muove a una frazione dell'immagine: è il differenziale,
          non il movimento, che il cervello legge come distanza. */}
      <div className="relative z-10 w-full">
        <ParallaxShift intensity={parallasse * 0.4}>
          <div className="shell pb-(--section-py) pt-40">
            <Reveal direction="up">
              {numero && etichetta ? (
                <SectionNumber numero={numero} titolo={etichetta} suFoto className="mb-6" />
              ) : null}

              {/* La misura sta sull'elemento che porta il corpo display: su un
                  contenitore, `ch` varrebbe il corpo del body. */}
              <h2 className={cn(altezza === "piena" ? "max-w-[15ch] text-hero" : "max-w-[17ch] text-h2")}>
                {titolo}
              </h2>

              {sommario ? <p className="mt-6 max-w-[44ch] text-lead text-cream/85">{sommario}</p> : null}

              {dato ? <p className="mt-6 font-mono text-mono uppercase text-brass">{dato}</p> : null}

              {azione ? <div className="mt-8">{azione}</div> : null}
            </Reveal>
          </div>
        </ParallaxShift>
      </div>
    </section>
  );
}
