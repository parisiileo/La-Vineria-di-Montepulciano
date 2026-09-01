// Pagina di controllo del design system. Non fa parte del sito pubblico:
// è esclusa dall'indicizzazione e non compare in nessuna navigazione.

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

import { routing } from "@/i18n/routing";
import { LangSwitch } from "@/components/ui/LangSwitch";
import { PaletteTable } from "@/components/kitchen/PaletteTable";
import { TypeScale } from "@/components/kitchen/TypeScale";
import { MotionTokens } from "@/components/kitchen/MotionTokens";
import { Primitives } from "@/components/kitchen/Primitives";
import { MotionWrappers } from "@/components/kitchen/MotionWrappers";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "kitchenSink" });
  return { title: t("titolo"), robots: { index: false, follow: false } };
}

/** Intestazione numerata di sezione: il numero è documentario, quindi mono. */
function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-8 flex items-baseline gap-4 border-b border-border pb-4">
      <span className="font-mono text-mono text-brass">{n}</span>
      <h2 className="text-h2">{title}</h2>
    </div>
  );
}

function Body() {
  const t = useTranslations("kitchenSink");

  const sections = [
    { n: "01", title: t("palette.titolo"), node: <PaletteTable /> },
    { n: "02", title: t("tipografia.titolo"), node: <TypeScale /> },
    { n: "03", title: t("movimento.titolo"), node: <MotionTokens /> },
    { n: "04", title: t("primitive.titolo"), node: <Primitives /> },
    { n: "05", title: t("primitive.movimento"), node: <MotionWrappers /> },
    { n: "06", title: t("griglia.titolo"), node: <GridDemo /> },
  ];

  return (
    <main id="contenuto" className="shell section-y">
      <header className="mb-24">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
          <span className="font-sans text-label uppercase text-stone-dim">{t("titolo")}</span>
          <LangSwitch />
        </div>
        <h1 className="text-hero">
          {t.rich("sottotitolo", { em: (chunks) => <em>{chunks}</em> })}
        </h1>
        <p className="measure mt-8 text-lead text-stone">{t("intro")}</p>
      </header>

      <div className="space-y-32">
        {sections.map(({ n, title, node }) => (
          <section key={n} aria-labelledby={`ks-${n}`}>
            <SectionHead n={n} title={title} />
            <div id={`ks-${n}`} className="sr-only">{title}</div>
            {node}
          </section>
        ))}
      </div>
    </main>
  );
}

/** Griglia a 12 colonne resa visibile, per controllare gutter e respiro. */
function GridDemo() {
  const t = useTranslations("kitchenSink.griglia");
  return (
    <div className="space-y-6">
      <div className="grid-editorial">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="grid h-24 place-items-center rounded-xs border border-border bg-tuff-light font-mono text-mono text-stone-dim"
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="full-bleed h-px bg-brass-dim" />
      <p className="measure font-sans text-mono text-stone-dim">{t("nota")}</p>
    </div>
  );
}

export default async function KitchenSinkPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return <Body />;
}
