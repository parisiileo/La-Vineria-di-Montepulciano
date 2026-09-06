// ARCHETIPO E — griglia asimmetrica.
//
// Quattro elementi di dimensioni e rapporti diversi, con una cella dominante.
// La regola che tiene in piedi l'archetipo è una sola: la cella dominante
// occupa più della metà della larghezza e ha il rapporto più largo. Se le
// quattro celle si equivalgono, non è una griglia asimmetrica, è una gallery.
//
// «Più della metà» non basta a occhio: con 7 colonne su 12 e una cella alta
// da 4, la prova a occhi socchiusi del §7.2 mostrava due protagonisti. Il
// rapporto è ora 8 a 3, e la gerarchia si legge sfocata.
//
// Impiego: la cucina, i dettagli. Densità alta della partitura.

import type { Foto } from "@/lib/data/foto";
import { Figure, type Rapporto } from "@/components/media/Figure";
import { RevealImage } from "@/components/media/RevealImage";
import { Reveal } from "@/components/motion/Reveal";
import { SectionNumber } from "@/components/sections/SectionNumber";
import { cn } from "@/lib/utils";

export interface CellaGriglia {
  foto: Foto;
  alt: string;
  rapporto: Rapporto;
  /** Didascalia in mono. Solo dove aggiunge un fatto, mai per riempire. */
  didascalia?: React.ReactNode;
}

export interface AsymmetricGridProps {
  id?: string;
  numero: string;
  etichetta: string;
  titolo: React.ReactNode;
  testo?: React.ReactNode;
  /** La cella che comanda: larga 8 colonne su 12, rapporto 3/2. */
  dominante: CellaGriglia;
  /** Le tre subordinate, in quest'ordine: alta, quadrata, larga. */
  secondarie: readonly [CellaGriglia, CellaGriglia, CellaGriglia];
  /** Azione della sezione, sotto il testo. Assente per default: una griglia
   *  di fotografie non ha bisogno di un bottone per essere una sezione. */
  azione?: React.ReactNode;
  className?: string;
}

function Cella({ cella, sizes, delay }: { cella: CellaGriglia; sizes: string; delay?: number }) {
  return (
    <RevealImage delay={delay}>
      <Figure
        foto={cella.foto}
        alt={cella.alt}
        rapporto={cella.rapporto}
        sizes={sizes}
        didascalia={cella.didascalia}
      />
    </RevealImage>
  );
}

export function AsymmetricGrid({
  id,
  numero,
  etichetta,
  titolo,
  testo,
  dominante,
  secondarie,
  azione,
  className,
}: AsymmetricGridProps) {
  const [alta, quadrata, larga] = secondarie;

  return (
    <section id={id} className={cn("section-y", className)}>
      <div className="grid-editorial items-end">
        <Reveal direction="up" className="col-span-12 md:col-span-5">
          <SectionNumber numero={numero} titolo={etichetta} className="mb-6" />
          <h2 className="text-h2">{titolo}</h2>
        </Reveal>
        {testo ? (
          <Reveal direction="up" className="col-span-12 md:col-span-5 md:col-start-8">
            <p className="measure text-body text-stone">{testo}</p>
            {azione ? <div className="mt-8">{azione}</div> : null}
          </Reveal>
        ) : null}
      </div>

      <div className="grid-editorial mt-16 items-start">
        {/* Riga 1 — la dominante e la cella alta: rapporti diversi, quindi
            i bordi inferiori non si allineano. È voluto. */}
        <div className="col-span-12 md:col-span-8">
          <Cella cella={dominante} sizes="(max-width: 768px) 100vw, 64vw" />
        </div>
        {/* Tre colonne contro otto. A quattro la cella alta pareggiava la
            dominante e la prova a occhi socchiusi mostrava due protagonisti:
            è la scala a fare la gerarchia, non il rapporto né la posizione. */}
        <div className="col-span-6 md:col-span-3 md:col-start-10 md:mt-[10vh]">
          <Cella cella={alta} sizes="(max-width: 768px) 50vw, 24vw" delay={0.08} />
        </div>

        {/* Riga 2 — rientra di una colonna: la griglia non torna mai a filo. */}
        <div className="col-span-6 md:col-span-3 md:col-start-2 md:mt-16">
          <Cella cella={quadrata} sizes="(max-width: 768px) 50vw, 24vw" delay={0.16} />
        </div>
        <div className="col-span-12 md:col-span-5 md:col-start-6 md:mt-24">
          <Cella cella={larga} sizes="(max-width: 768px) 100vw, 40vw" delay={0.24} />
        </div>
      </div>
    </section>
  );
}
