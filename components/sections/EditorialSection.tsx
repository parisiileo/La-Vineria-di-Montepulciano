// ARCHETIPO B — editoriale asimmetrica.
//
// Testo su una colonna stretta, immagine sulle restanti, con uno sfasamento
// verticale deliberato: il testo non è mai allineato in alto con l'immagine.
// Lo sfasamento è tutto. Allineati, i due blocchi si leggono come due celle
// di una tabella; sfalsati, la pagina sembra composta invece che riempita.
//
// Impiego: la famiglia, il vino. Densità media della partitura.

import type { Foto } from "@/lib/data/foto";
import { Figure, type Rapporto } from "@/components/media/Figure";
import { RevealImage } from "@/components/media/RevealImage";
import { Reveal } from "@/components/motion/Reveal";
import { ParallaxShift } from "@/components/motion/Parallax";
import { cn } from "@/lib/utils";

export interface EditorialSectionProps {
  id?: string;
  titolo: React.ReactNode;
  /** La colonna di lettura. Mai oltre 60ch: è il vincolo, non lo stile. */
  testo: React.ReactNode;
  dato?: React.ReactNode;
  azione?: React.ReactNode;
  foto: Foto;
  alt: string;
  rapporto: Rapporto;
  /** Lato del testo. Alternare fra due sezioni B consecutive nella pagina. */
  lato?: "start" | "end";
  /**
   * Chi dei due scende. `testo` = il testo parte sotto il bordo alto
   * dell'immagine; `immagine` = il contrario. Non esiste il valore "nessuno".
   */
  sfasamento?: "testo" | "immagine";
  /**
   * Colonne occupate dall'immagine, su 12. Sei è il valore giusto per un
   * ritratto 4/5; con un'immagine molto verticale scende a cinque, altrimenti
   * la colonna di testo finisce accanto a un vuoto alto mezzo schermo.
   */
  colonneImmagine?: 5 | 6 | 7;
  /** Seconda fotografia, piccola, che si sovrappone alla prima: occlusione. */
  inserto?: { foto: Foto; alt: string; rapporto: Rapporto; didascalia?: React.ReactNode };
  className?: string;
}

export function EditorialSection({
  id,
  titolo,
  testo,
  dato,
  azione,
  foto,
  alt,
  rapporto,
  lato = "start",
  sfasamento = "testo",
  colonneImmagine = 6,
  inserto,
  className,
}: EditorialSectionProps) {
  const testoPrima = lato === "start";
  // Le classi sono scritte per esteso: Tailwind non vede le stringhe composte.
  const COLONNE = {
    5: { larghezza: "md:col-span-5", inizio: testoPrima ? "md:col-start-8" : "md:col-start-1" },
    6: { larghezza: "md:col-span-6", inizio: testoPrima ? "md:col-start-7" : "md:col-start-1" },
    7: { larghezza: "md:col-span-7", inizio: testoPrima ? "md:col-start-6" : "md:col-start-1" },
  }[colonneImmagine];

  return (
    <section id={id} className={cn("section-y", className)}>
      <div className="grid-editorial items-start">
        {/* Testo: 5 colonne su 12. La misura stretta è ciò che rende
            l'asimmetria leggibile invece che sbilanciata. */}
        <div
          className={cn(
            "col-span-12 md:col-span-5",
            testoPrima ? "md:col-start-1" : "md:col-start-8",
            sfasamento === "testo" ? "md:mt-[10vh]" : "md:mt-0",
            "order-2 md:order-none",
          )}
        >
          <Reveal direction="up">
            <h2 className="text-h2">{titolo}</h2>
            <div className="measure mt-8 space-y-5 text-body text-stone">{testo}</div>
            {dato ? (
              <p className="mt-8 border-t border-border pt-5 font-mono text-mono uppercase text-brass">
                {dato}
              </p>
            ) : null}
            {azione ? <div className="mt-8">{azione}</div> : null}
          </Reveal>
        </div>

        {/* Immagine: 6 colonne, con una colonna di respiro fra le due parti. */}
        <div
          className={cn(
            "relative col-span-12",
            COLONNE.larghezza,
            COLONNE.inizio,
            sfasamento === "immagine" ? "md:mt-[10vh]" : "md:mt-0",
            "order-1 md:order-none",
          )}
        >
          <RevealImage>
            <Figure
              foto={foto}
              alt={alt}
              rapporto={rapporto}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </RevealImage>

          {/* L'inserto sborda dal bordo dell'immagine e finisce sul tufo:
              due piani distinti là dove ce n'era uno solo.
              Sotto i 768px l'occlusione decade — su schermo stretto due
              immagini sovrapposte sono solo due immagini sovrapposte — ma
              l'inserto resta, in flusso sotto la prima. Nasconderlo avrebbe
              tolto al visitatore mobile l'unico documento d'archivio del
              sito per salvare un effetto. */}
          {inserto ? (
            <ParallaxShift
              intensity={0.35}
              className={cn(
                "relative z-10 mt-6 w-[64%] md:absolute md:mt-0 md:w-[42%]",
                testoPrima ? "md:-left-[12%] md:bottom-[-8%]" : "md:-right-[12%] md:bottom-[-8%]",
              )}
            >
              <RevealImage delay={0.15}>
                <Figure
                  foto={inserto.foto}
                  alt={inserto.alt}
                  rapporto={inserto.rapporto}
                  sizes="20vw"
                  didascalia={inserto.didascalia}
                />
              </RevealImage>
            </ParallaxShift>
          ) : null}
        </div>
      </div>
    </section>
  );
}
