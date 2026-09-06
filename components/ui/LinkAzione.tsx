"use client";

// Azione che naviga. Stesse classi del bottone, elemento diverso.
// Le ancore interne passano da `Ancora`, che le fa scorrere con Lenis invece
// di far saltare il browser.

import { Ancora } from "@/components/chrome/Ancora";
import { classiAzione, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LinkAzioneProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Link esterno: apre in una scheda nuova e lo dichiara. */
  esterno?: boolean;
  etichettaEsterno?: string;
}

export function LinkAzione({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  esterno = false,
  etichettaEsterno,
}: LinkAzioneProps) {
  const classi = cn(classiAzione(variant, size), className);

  if (esterno) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classi}>
        <span className="relative">{children}</span>
        {etichettaEsterno ? <span className="sr-only">{etichettaEsterno}</span> : null}
      </a>
    );
  }

  return (
    <Ancora href={href} className={classi}>
      <span className="relative">{children}</span>
    </Ancora>
  );
}
