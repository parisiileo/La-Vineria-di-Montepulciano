// Segnaposto della home. Le sezioni reali arrivano nello Step 4: qui c'è solo
// quanto serve a verificare font, fondo e grana su una pagina vera.

import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

import { routing } from "@/i18n/routing";
import { LangSwitch } from "@/components/ui/LangSwitch";
import { LOCALI, TELEFONO, TELEFONO_HREF } from "@/lib/data/locali";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function Body() {
  const t = useTranslations("brand");
  const tc = useTranslations("common");
  const tl = useTranslations("locali");

  return (
    <main id="contenuto" className="shell flex min-h-dvh flex-col justify-between pb-12 pt-28">
      <div className="flex items-center justify-between gap-6">
        <span className="font-sans text-label uppercase text-stone-dim">{t("famiglia")}</span>
        <LangSwitch />
      </div>

      <div>
        <h1 className="text-hero">
          {t("nome")} <em>{t("luogo")}</em>
        </h1>
        <p className="measure mt-8 text-lead text-stone">{t("concetto")}</p>
      </div>

      <footer className="grid gap-8 border-t border-border pt-8 sm:grid-cols-3">
        {LOCALI.map((sede) => {
          const key = sede.id === "gracciano-101" ? "gracciano101" : "gracciano72";
          return (
            <div key={sede.id}>
              <p className="font-sans text-label uppercase text-stone-dim">{tl(`${key}.nome`)}</p>
              <p className="mt-2 text-body text-stone">
                {sede.via} <span className="font-mono text-brass">{sede.civico}</span>
              </p>
              <p className="text-body text-stone-dim">
                {sede.cap} {sede.citta} ({sede.provincia})
              </p>
            </div>
          );
        })}

        <div>
          <p className="font-sans text-label uppercase text-stone-dim">{tc("telefono")}</p>
          <a
            href={TELEFONO_HREF}
            className="underline-grow relative mt-2 inline-block font-mono text-mono text-brass"
          >
            {TELEFONO}
          </a>
        </div>
      </footer>
    </main>
  );
}

export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return <Body />;
}
