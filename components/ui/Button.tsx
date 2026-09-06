"use client";

// Bottone in tre registri. Il comportamento tattile (sollevamento, pressione,
// riempimento, sottolineatura) sta in globals.css: qui c'è solo composizione.

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "ghost" | "link";
export type ButtonSize = "md" | "lg";

const BASE =
  "press relative inline-flex min-h-(--tap-min) items-center justify-center gap-3 rounded-sm font-sans text-label uppercase disabled:pointer-events-none disabled:opacity-40";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "sweep overflow-hidden bg-wine text-cream",
  ghost:
    "overflow-hidden border border-border text-cream hover:border-border-hover hover:bg-brass/8",
  link: "underline-grow rounded-none px-0 text-brass",
};

const SIZE: Record<ButtonSize, string> = {
  md: "px-6 py-3",
  lg: "px-8 py-4",
};

/**
 * Le stesse classi, per gli elementi che sono LINK e non bottoni.
 * Un'azione che porta altrove è un link, anche quando sembra un bottone: un
 * `<button>` che naviga toglie l'apertura in una scheda nuova, il menu
 * contestuale e l'annuncio corretto agli screen reader. Le classi sono
 * condivise, l'elemento no.
 */
export function classiAzione(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cn(BASE, VARIANT[variant], variant === "link" ? "py-3" : SIZE[size]);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Etichetta annunciata durante il caricamento. */
  loadingLabel?: string;
}

/** Arco d'ottone che ruota: uno spinner generico tradirebbe l'art direction. */
function BrassArc({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex size-4 shrink-0">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-full"
        style={{ animation: "arc-spin var(--dur-slow) linear infinite" }}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="14 42"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    loadingLabel = "",
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        BASE,
        VARIANT[variant],
        variant === "link" ? "py-3" : SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? <BrassArc label={loadingLabel} /> : null}
      <span className="relative">{children}</span>
    </button>
  );
});
