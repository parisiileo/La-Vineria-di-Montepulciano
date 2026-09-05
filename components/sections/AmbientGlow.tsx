// Sorgente di luce fuori campo. Simula una lampada che non si vede, ed è il
// modo più economico per dare volume a una sezione senza aggiungere un solo
// elemento visibile.
//
// Massimo due per pagina, verificato in scripts/audit.mjs (controllo 6).
// È l'effetto che si abusa più facilmente: alla terza sorgente la pagina non
// ha più profondità, ha una velatura.

import { cn } from "@/lib/utils";

interface AmbientGlowProps {
  sorgente: "ottone" | "vino";
  /** Classi di posizione e dimensione: il glow è sempre più largo del blocco. */
  className: string;
}

export function AmbientGlow({ sorgente, className }: AmbientGlowProps) {
  return (
    <div
      aria-hidden="true"
      data-glow=""
      className={cn("glow-ambientale", sorgente === "ottone" ? "glow-ottone" : "glow-vino", className)}
    />
  );
}
