// Scala tipografica al completo. Ogni riga mostra il token e il valore CSS
// accanto al campione: leggere "clamp(2.5rem, 7.5vw, 8rem)" sotto al titolo
// è l'unico modo per accorgersi che il minimo è sbagliato a 390px.

import { useTranslations } from "next-intl";

const ROWS = [
  { token: "--text-hero", cls: "text-hero font-display", clamp: "clamp(2.5rem, 7.5vw, 8rem)", meta: "lh 0.92 · tracking -0.035em" },
  { token: "--text-h2", cls: "text-h2 font-display", clamp: "clamp(1.875rem, 4.5vw, 4.5rem)", meta: "lh 1.00 · tracking -0.025em" },
  { token: "--text-h3", cls: "text-h3 font-display", clamp: "clamp(1.25rem, 2.4vw, 2rem)", meta: "lh 1.15 · tracking -0.015em" },
  { token: "--text-lead", cls: "text-lead font-sans text-stone", clamp: "clamp(1.125rem, 1.6vw, 1.5rem)", meta: "lh 1.55" },
  { token: "--text-body", cls: "text-body font-sans text-stone", clamp: "clamp(1rem, 1.05vw, 1.125rem)", meta: "lh 1.70 · misura 45–70ch" },
  { token: "--text-label", cls: "text-label font-sans uppercase text-stone-dim", clamp: "0.75rem", meta: "tracking 0.20em" },
  { token: "--text-mono", cls: "text-mono font-mono text-brass", clamp: "0.8125rem", meta: "tracking 0.06em" },
] as const;

const SAMPLE_KEY = {
  "--text-hero": "esempioHero",
  "--text-h2": "esempioH2",
  "--text-h3": "esempioH3",
  "--text-lead": "esempioLead",
  "--text-body": "esempioBody",
  "--text-label": "esempioLabel",
  "--text-mono": "esempioMono",
} as const;

export function TypeScale() {
  const t = useTranslations("kitchenSink.tipografia");

  return (
    <div className="space-y-12">
      {ROWS.map(({ token, cls, clamp, meta }) => (
        <div key={token} className="border-t border-border pt-6">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="font-mono text-mono text-brass">{token}</span>
            <span className="font-mono text-mono text-stone-dim">{clamp}</span>
            <span className="font-sans text-mono text-stone-dim">{meta}</span>
          </div>
          <p className={`measure ${cls}`}>
            {t.rich(SAMPLE_KEY[token], { em: (chunks) => <em>{chunks}</em> })}
          </p>
        </div>
      ))}

      <p className="measure font-sans text-mono text-stone-dim">{t("nota")}</p>
    </div>
  );
}
