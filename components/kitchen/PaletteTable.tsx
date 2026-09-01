// Tabella della palette con i rapporti di contrasto calcolati a runtime dai
// token reali. Se qualcuno cambia un colore in globals.css e dimentica di
// aggiornare palette.ts, `npm run audit` lo blocca prima di questa pagina.

import { useTranslations } from "next-intl";
import { BORDERS, CONTRACT, PALETTE } from "@/lib/palette";
import { contrast, flatten, luminance, verdict } from "@/lib/contrast";
import { cn } from "@/lib/utils";

const VERDICT_KEY = {
  aa: "esitoAA",
  "aa-large": "esitoAALarge",
  fail: "esitoFail",
} as const;

export function PaletteTable() {
  const t = useTranslations("kitchenSink.palette");

  return (
    <div className="space-y-8">
      {/* Campioni: il colore va visto prima di essere misurato. L'etichetta
          sceglie fra crema e tufo profondo secondo la luminanza del campione —
          `mix-blend-difference` produrrebbe ciani che nella palette non esistono. */}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {Object.entries(PALETTE).map(([name, hex]) => {
          const ink = luminance(hex) > 0.2 ? "tuff-deep" : "cream";
          return (
            <li
              key={name}
              className="rounded-sm border border-border p-3"
              style={{ backgroundColor: `var(--color-${name})`, color: `var(--color-${ink})` }}
            >
              <span className="block font-mono text-mono">{name}</span>
              <span className="block font-mono text-mono opacity-70">{hex}</span>
            </li>
          );
        })}
      </ul>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-start">
          <thead>
            <tr className="border-b border-border">
              {[t("colonnaCoppia"), t("colonnaCampione"), t("colonnaRatio"), t("colonnaEsito")].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="py-3 pe-6 text-start font-sans text-label uppercase text-stone-dim"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONTRACT.map(({ fg, bg, min, ruolo }) => {
              const ratio = contrast(PALETTE[fg], PALETTE[bg]);
              const result = verdict(ratio);
              const meets = ratio >= min;
              return (
                <tr key={`${fg}-${bg}`} className="border-b border-border">
                  <td className="py-3 pe-6 align-middle">
                    <span className="block font-mono text-mono text-stone">
                      {fg} / {bg}
                    </span>
                    <span className="block font-sans text-mono text-stone-dim">{ruolo}</span>
                  </td>
                  <td className="py-3 pe-6 align-middle">
                    <span
                      className="inline-block rounded-sm px-4 py-2"
                      style={{
                        backgroundColor: `var(--color-${bg})`,
                        color: `var(--color-${fg})`,
                      }}
                    >
                      {t("campione")}
                    </span>
                  </td>
                  <td className="py-3 pe-6 align-middle font-mono text-mono text-cream">
                    {ratio.toFixed(2)}:1
                  </td>
                  <td
                    className={cn(
                      "py-3 pe-6 align-middle font-sans text-mono",
                      meets ? "text-brass" : "text-error",
                    )}
                  >
                    {t(VERDICT_KEY[result])}
                  </td>
                </tr>
              );
            })}

            {BORDERS.map(({ nome, fg, alpha, bg, richiede3 }) => {
              const flat = flatten(PALETTE[fg], alpha, PALETTE[bg]);
              const ratio = contrast(flat, PALETTE[bg]);
              const meets = !richiede3 || ratio >= 3;
              return (
                <tr key={nome} className="border-b border-border">
                  <td className="py-3 pe-6 align-middle">
                    <span className="block font-mono text-mono text-stone">{nome}</span>
                    <span className="block font-sans text-mono text-stone-dim">
                      {richiede3 ? t("bordoNorma") : t("bordoDecorativo")}
                    </span>
                  </td>
                  <td className="py-3 pe-6 align-middle">
                    <span
                      className="inline-block h-10 w-24 rounded-sm border"
                      style={{
                        backgroundColor: `var(--color-${bg})`,
                        borderColor: `var(${nome})`,
                      }}
                    />
                  </td>
                  <td className="py-3 pe-6 align-middle font-mono text-mono text-cream">
                    {ratio.toFixed(2)}:1
                  </td>
                  <td
                    className={cn(
                      "py-3 pe-6 align-middle font-sans text-mono",
                      meets ? "text-brass" : "text-error",
                    )}
                  >
                    {t(VERDICT_KEY[richiede3 ? verdict(ratio) : "aa"])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="measure font-sans text-mono text-stone-dim">{t("nota")}</p>
    </div>
  );
}
