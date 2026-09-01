"use client";

// Selettore di lingua a segmenti. Mai un dropdown: due opzioni non meritano
// un pannello, e la pillola che scorre dice da sola che cosa sta cambiando.

import { useTransition } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { spring } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { cn } from "@/lib/utils";

export function LangSwitch({ className }: { className?: string }) {
  const t = useTranslations("lang");
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [pending, startTransition] = useTransition();

  function go(next: Locale) {
    if (next === active) return;
    startTransition(() => router.replace(pathname, { locale: next }));
  }

  return (
    <div
      role="group"
      aria-label={t("switchLabel")}
      aria-busy={pending || undefined}
      className={cn(
        "relative inline-flex rounded-pill border border-border p-1",
        className,
      )}
    >
      {routing.locales.map((locale) => {
        const isActive = locale === active;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            onClick={() => go(locale)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "relative grid min-h-(--tap-min) min-w-(--tap-min) place-items-center rounded-pill px-4",
              "font-mono text-mono uppercase",
              "transition-colors duration-(--dur-micro) ease-(--ease-soft)",
              isActive ? "text-tuff-deep" : "text-stone-dim hover:text-cream",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-pill bg-brass"
                transition={reduced ? { duration: 0 } : spring.layout}
              />
            ) : null}
            <span className="relative">{t(locale)}</span>
            <span className="sr-only">{t(`${locale}Full`)}</span>
          </button>
        );
      })}
    </div>
  );
}
