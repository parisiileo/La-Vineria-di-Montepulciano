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
//   respiro    testo contenuto nella colonna, molto bianco, densità minima.
//              È la discesa e la risalita della partitura, il momento in cui
//              il sito rallenta. Il rallentamento è ciò che rende memorabile
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
import { cn } from "@/lib/utils";

export interface TypeSectionProps {
  id?: string;
  registro: "respiro" | "monumento";
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
        // `full-bleed` su ENTRAMBI i registri, e non solo sul monumento.
        // Non è il fondo a chiederlo — il respiro non ne ha uno — ma la luce:
        // il glow è posizionato `right-0` ed è largo 42vw, cioè è una lampada
        // FUORI CAMPO. Dentro una colonna larga 90rem non era più fuori campo,
        // era dentro un rettangolo: il contenitore la ritagliava sul bordo
        // dello shell e il degradare del blur finiva contro uno spigolo netto,
        // visibile su ogni schermo più largo di ~1630px. Una sorgente di luce
        // con un bordo dritto ha smesso di essere una sorgente di luce.
        //
        // Il testo non si sposta di un pixel: la colonna la ristabilisce lo
        // `shell` qui sotto, che ora vale per tutti e due i registri.
        "full-bleed relative isolate",
        monumento
          ? "overflow-hidden bg-tuff-deep py-[max(var(--section-py),18vh)]"
          : "py-[max(var(--section-py),16vh)]",
        className,
      )}
    >
      {glow ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {glow}
        </div>
      ) : null}

      <div className="relative shell">
        <ParallaxShift intensity={monumento ? 0.5 : 0.25}>
          <Reveal direction="up">
            {/* La misura sta qui e non sul contenitore: `ch` si calcola sul
                corpo dell'elemento che lo porta, e sul contenitore varrebbe
                il corpo del body — un ventesimo di quello del display. */}
            <p
              data-display=""
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
