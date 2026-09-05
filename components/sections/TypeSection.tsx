// ARCHETIPO D — tipografica pura.
//
// Nessuna immagine. Solo testo, molto spazio, un dettaglio in ottone.
//
// È l'archetipo che la maggior parte dei siti non ha, ed è quello che fa la
// differenza: una pagina che non respira mai stanca, e una sezione di sola
// tipografia grande e ben spaziata si legge come sicurezza di sé. È anche il
// più rischioso da rendere bene, perché non ha niente dietro cui nascondersi.
//
// Due registri, e la distinzione non è decorativa ma di densità:
//
//   respiro    contenuto nello shell, molto bianco, densità minima. È la
//              discesa e la risalita della partitura, il momento in cui il
//              sito rallenta. Il rallentamento è ciò che rende memorabile
//              quello che viene dopo.
//
//   monumento  full-bleed su tufo profondo, corpo hero, densità massima.
//              Esiste perché in questo sito il punto più profondo della
//              pagina — la cantina — non ha una fotografia: il cliente non
//              ne possiede una. Un archetipo D in registro respiro al posto
//              di una A lascerebbe un buco nella partitura; in registro
//              monumento la sostituisce di peso.

import { Reveal } from "@/components/motion/Reveal";
import { ParallaxShift } from "@/components/motion/Parallax";
import { SectionNumber } from "@/components/sections/SectionNumber";
import { cn } from "@/lib/utils";

export interface TypeSectionProps {
  id?: string;
  registro: "respiro" | "monumento";
  numero?: string;
  etichetta?: string;
  /** Il protagonista assoluto: qui non c'è una fotografia a contenderglielo. */
  testo: React.ReactNode;
  /** Riga di appoggio. Sul registro respiro va usata con parsimonia. */
  sottotesto?: React.ReactNode;
  /** Dato documentario in mono ottone. */
  dato?: React.ReactNode;
  azione?: React.ReactNode;
  /**
   * La luce fuori campo, se la sezione la merita. Massimo due per pagina,
   * verificato in scripts/audit.mjs.
   *
   * Il glow viene montato dentro uno strato che ritaglia: una sorgente che
   * sborda dal box della sezione allarga il documento e fa scorrere la
   * pagina in orizzontale. E' successo, e la correzione sta qui invece che
   * nel punto di chiamata perche' chi montera' il prossimo glow non deve
   * doverselo ricordare.
   */
  glow?: React.ReactNode;
  className?: string;
}

export function TypeSection({
  id,
  registro,
  numero,
  etichetta,
  testo,
  sottotesto,
  dato,
  azione,
  glow,
  className,
}: TypeSectionProps) {
  const monumento = registro === "monumento";

  return (
    <section
      id={id}
      className={cn(
        "relative isolate",
        monumento
          ? "full-bleed overflow-hidden bg-tuff-deep py-[max(var(--section-py),18vh)]"
          : "py-[max(var(--section-py),16vh)]",
        className,
      )}
    >
      {glow ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {glow}
        </div>
      ) : null}

      <div className={cn("relative", monumento && "shell")}>
        <ParallaxShift intensity={monumento ? 0.5 : 0.25}>
          <Reveal direction="up">
            {numero && etichetta ? (
              <SectionNumber numero={numero} titolo={etichetta} className="mb-10" />
            ) : (
              // Il dettaglio in ottone. Sul registro respiro è l'unico
              // elemento non testuale della sezione, e basta.
              <span aria-hidden="true" className="mb-10 block h-px w-16 bg-brass" />
            )}

            {/* La misura sta qui e non sul contenitore: `ch` si calcola sul
                corpo dell'elemento che lo porta, e sul contenitore varrebbe
                il corpo del body — un ventesimo di quello del display. */}
            <p
              className={cn(
                "font-display text-balance text-cream",
                monumento ? "max-w-[15ch] text-hero" : "max-w-[17ch] text-h2",
              )}
            >
              {testo}
            </p>

            {sottotesto ? (
              <p className="measure mt-10 text-lead text-stone">{sottotesto}</p>
            ) : null}

            {dato ? (
              <p className="mt-10 font-mono text-mono uppercase text-brass">{dato}</p>
            ) : null}

            {azione ? <div className="mt-10">{azione}</div> : null}
          </Reveal>
        </ParallaxShift>
      </div>
    </section>
  );
}
