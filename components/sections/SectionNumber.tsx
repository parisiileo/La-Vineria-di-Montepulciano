// 01 — LA FAMIGLIA.
//
// Sembra banale e non lo è: comunica che la pagina è una sequenza costruita
// e non un elenco di blocchi. Il visitatore non lo legge coscientemente, ma
// registra che c'è un progetto dietro.
//
// Due regole, entrambe non negoziabili: sta sempre nello stesso punto
// rispetto al titolo, e resta piccolo. Un numero di sezione che compete col
// titolo ha smesso di essere un indice ed è diventato decorazione.

import { cn } from "@/lib/utils";

interface SectionNumberProps {
  /** Due cifre, sempre: "1 — LA FAMIGLIA" perde il carattere documentario. */
  numero: string;
  titolo: string;
  className?: string;
  /** Sopra fotografia: il filetto perde contrasto e va tolto. */
  suFoto?: boolean;
}

export function SectionNumber({ numero, titolo, className, suFoto = false }: SectionNumberProps) {
  return (
    <p className={cn("flex items-center gap-3 font-mono text-mono uppercase", className)}>
      <span className="text-brass">{numero}</span>
      <span aria-hidden="true" className={cn("h-px w-6", suFoto ? "bg-brass/60" : "bg-brass-dim")} />
      <span className={cn(suFoto ? "text-cream/80" : "text-stone-dim")}>{titolo}</span>
    </p>
  );
}
