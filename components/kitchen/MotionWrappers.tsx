"use client";

// I quattro wrapper di movimento in funzione. Servono a verificare a occhio
// che il blur del Reveal si senta e che il Parallax invece non si veda.

import { useTranslations } from "next-intl";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { Magnetic } from "@/components/motion/Magnetic";
import { Parallax } from "@/components/motion/Parallax";
import { Button } from "@/components/ui/Button";
import { LOCALI } from "@/lib/data/locali";

export function MotionWrappers() {
  const t = useTranslations("kitchenSink");
  const tb = useTranslations("brand");
  const tc = useTranslations("common");
  const tl = useTranslations("locali");

  return (
    <div className="space-y-16">
      <div className="border-t border-border pt-6">
        <p className="mb-4 font-mono text-mono text-brass">SplitText</p>
        <SplitText
          as="h3"
          className="text-h2"
          text={tb("tagline")}
          accentWords={["storia", "centuries"]}
        />
      </div>

      <div className="border-t border-border pt-6">
        <p className="mb-4 font-mono text-mono text-brass">Reveal · staggerChildren</p>
        <Reveal as="div" staggerChildren="base" className="grid gap-4 sm:grid-cols-2">
          {LOCALI.map((sede) => {
            const key = sede.id === "gracciano-101" ? "gracciano101" : "gracciano72";
            return (
              <RevealItem
                key={sede.id}
                className="rounded-sm border border-border bg-tuff-light p-6"
              >
                <span className="block font-mono text-mono text-brass">{sede.civico}</span>
                <span className="mt-2 block text-h3">{tl(`${key}.nome`)}</span>
                <p className="measure mt-3 text-body text-stone">{tl(`${key}.sommario`)}</p>
              </RevealItem>
            );
          })}
        </Reveal>
      </div>

      <div className="border-t border-border pt-6">
        <p className="mb-4 font-mono text-mono text-brass">Magnetic</p>
        <Magnetic>
          <Button variant="ghost" size="lg">{tc("scopri")}</Button>
        </Magnetic>
      </div>

      <div className="border-t border-border pt-6">
        <p className="mb-4 font-mono text-mono text-brass">Parallax</p>
        {/* Nessuna fotografia disponibile allo Step 1: il campione usa una
            gradazione di tufo, che è comunque sufficiente a valutare l'ampiezza. */}
        <Parallax className="h-64 rounded-sm border border-border">
          <div className="h-full w-full bg-gradient-to-b from-tuff-raised via-tuff-light to-tuff-deep">
            <p className="p-6 font-sans text-label uppercase text-stone-dim">
              {t("tipografia.esempioLabel")}
            </p>
          </div>
        </Parallax>
      </div>
    </div>
  );
}
