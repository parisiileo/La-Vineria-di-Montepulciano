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
import { SplitText } from "@/components/motion/SplitText";
import { ScrollIndicator } from "@/components/chrome/ScrollIndicator";
import { cn } from "@/lib/utils";

export interface FullBleedSectionProps {
  id?: string;
  /** Il protagonista. Un solo elemento a --t-hero o --t-h2, mai due. */
  titolo?: React.ReactNode;
  /**
   * Alternativa a `titolo` per l'hero: testo piano che entra parola per
   * parola da dietro una linea di taglio. Le parole in `accenti` arrivano
   * dopo le altre, in corsivo e in ottone — è il momento tipografico del
   * sito, e funziona solo se la parola ritardata è quella che porta il
   * significato della frase.
   */
  titoloTesto?: string;
  accenti?: readonly string[];
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
  /** Indicatore di scroll in fondo. Solo sull'hero, e uno solo per pagina. */
  indicatore?: React.ReactNode;
  className?: string;
}

export function FullBleedSection({
  id,
  titolo,
  titoloTesto,
  accenti,
  sommario,
  dato,
  azione,
  foto,
  alt,
  rapporto,
  altezza = "alta",
  priority = false,
  parallasse = 1,
  indicatore,
  className,
}: FullBleedSectionProps) {
  // Cronologia dell'hero. Sono ritardi, non durate, e `Reveal` li dimezza da
  // solo sotto i 768px: su schermo stretto si scrolla veloce, e una sequenza
  // lunga un secondo arriverebbe a hero già passato.
  //
  // Ricalibrata dopo la rimozione dell'occhiello. Prima la sequenza partiva
  // da lui a 0.15 e il titolo entrava a 0.30; togliendo l'occhiello e
  // lasciando gli altri numeri, il primo terzo di secondo sarebbe stato uno
  // schermo fermo — un buco, non un'attesa. Il titolo prende il posto e
  // l'orario di partenza dell'occhiello, e tutto il resto si stringe di
  // conseguenza mantenendo gli intervalli relativi: 0.45 fra titolo e
  // sommario, 0.20 fra sommario e azione.
  //
  // Le CTA restano per ultime: una chiamata all'azione che appare prima di
  // ciò che la motiva è rumore.
  const hero = altezza === "piena";
  const t = {
    titolo: hero ? 0.15 : 0,
    sommario: hero ? 0.6 : 0.08,
    dato: hero ? 0.7 : 0.12,
    azione: hero ? 0.8 : 0.16,
  };
  return (
    <section
      id={id}
      className={cn(
        "full-bleed relative isolate flex items-end overflow-hidden",
        // `dvh` e non `vh`: su iOS Safari `100vh` ignora la barra
        // dell'indirizzo e taglia il fondo della sezione, cioè proprio dove
        // stanno le CTA, sul dispositivo da cui arriva la maggior parte del
        // traffico. `dvh` dà l'altezza reale disponibile.
        //
        // In orizzontale su telefono l'altezza piena non è una scelta ma un
        // problema: a 390px di altezza il titolo da solo occupa lo schermo.
        // Sotto i 500px di viewport l'hero torna alto quanto il suo contenuto.
        altezza === "piena" ? "hero-piena" : "min-h-[72svh]",
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
          {/* L'indicatore di scroll vive in fondo alla sezione: senza questo
              respiro in più finisce sopra l'ultima riga del blocco di testo,
              e due elementi diversi si leggono come uno solo mal composto. */}
          <div className={cn("shell pt-40", indicatore ? "pb-32 sm:pb-40" : "pb-(--section-py)")}>
            {/* La misura sta sull'elemento che porta il corpo display: su un
                contenitore, `ch` varrebbe il corpo del body. */}
            {titoloTesto ? (
              <SplitText
                // Sull'hero il titolo è l'intestazione di primo livello
                // della pagina: `h2` lo renderebbe un sotto-titolo di
                // niente, e la pagina resterebbe senza h1.
                as={hero ? "h1" : "h2"}
                text={titoloTesto}
                accentWords={accenti}
                delay={t.titolo}
                className={cn(hero ? "max-w-[15ch] text-hero" : "max-w-[17ch] text-h2")}
              />
            ) : (
              <Reveal direction="up" delay={t.titolo}>
                {hero ? (
                  <h1 className="max-w-[15ch] text-hero">{titolo}</h1>
                ) : (
                  <h2 className="max-w-[17ch] text-h2">{titolo}</h2>
                )}
              </Reveal>
            )}

            {sommario ? (
              <Reveal direction="up" delay={t.sommario}>
                <p className="mt-6 max-w-[44ch] text-lead text-cream/85">{sommario}</p>
              </Reveal>
            ) : null}

            {dato ? (
              <Reveal direction="up" delay={t.dato}>
                <p className="mt-6 font-mono text-mono uppercase text-brass">{dato}</p>
              </Reveal>
            ) : null}

            {azione ? (
              <Reveal direction="up" delay={t.azione}>
                <div className="mt-8">{azione}</div>
              </Reveal>
            ) : null}
          </div>
        </ParallaxShift>
      </div>

      {indicatore ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center">
          <ScrollIndicator etichetta={indicatore} />
        </div>
      ) : null}
    </section>
  );
}
