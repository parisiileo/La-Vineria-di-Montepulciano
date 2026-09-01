"use client";

// Titolo che sale parola per parola da dietro una linea di taglio.
// Divisione per parole e non per lettere: su un serif elegante le lettere
// singole distruggono il ritmo tipografico e il kerning.

import { motion, type Variants } from "motion/react";
import { duration, ease } from "@/lib/motion";
import { useReducedMotion } from "./useReducedMotion";
import { cn } from "@/lib/utils";

const TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

export type SplitTag = keyof typeof TAGS;

const WORD_STAGGER = 0.07;
/** Ritardo aggiuntivo delle parole accentate: arrivano dopo, e si notano. */
const ACCENT_DELAY = 0.15;

interface SplitTextProps {
  text: string;
  as?: SplitTag;
  className?: string;
  delay?: number;
  /** Parole che ricevono corsivo, colore ottone e un ritardo supplementare. */
  accentWords?: readonly string[];
}

const normalize = (word: string) =>
  word.toLocaleLowerCase("it").replace(/[.,;:!?«»"'()—–-]/g, "");

/**
 * Il trigger di viewport sta sul contenitore, non sulle parole.
 * Ogni parola è traslata del 110% fuori dal proprio contenitore
 * `overflow-hidden`: la sua area di intersezione è quindi zero, e un
 * `whileInView` applicato alla parola non scatterebbe mai — il titolo
 * resterebbe tagliato per sempre. Il contenitore invece non è ritagliato.
 */
const CONTAINER: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: WORD_STAGGER } },
};

const WORD: Variants = {
  hidden: { y: "110%" },
  shown: (isAccent: boolean) => ({
    y: "0%",
    transition: {
      duration: duration.slow,
      ease: ease.out,
      delay: isAccent ? ACCENT_DELAY : 0,
    },
  }),
};

export function SplitText({
  text,
  as = "h2",
  className,
  delay = 0,
  accentWords = [],
}: SplitTextProps) {
  const reduced = useReducedMotion();
  const Tag = TAGS[as];
  const words = text.split(" ").filter(Boolean);
  const accents = new Set(accentWords.map(normalize));

  const rendered = words.map((word, i) => (
    <span key={`${word}-${i}`}>
      {accents.has(normalize(word)) ? <em>{word}</em> : word}
      {i < words.length - 1 ? " " : null}
    </span>
  ));

  if (reduced) {
    const Plain = as;
    return <Plain className={cn(className)}>{rendered}</Plain>;
  }

  return (
    <Tag className={cn(className)}>
      {/* La frase intera resta nell'albero di accessibilità: gli screen reader
          leggono una frase, non una collana di parole scollegate. */}
      <span className="sr-only">{text}</span>

      <motion.span
        aria-hidden="true"
        variants={CONTAINER}
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ delayChildren: delay }}
      >
        {words.map((word, i) => {
          const isAccent = accents.has(normalize(word));
          return (
            <span key={`${word}-${i}`}>
              <span
                className="inline-flex overflow-hidden align-bottom"
                style={{
                  paddingBottom: "var(--split-descender)",
                  marginBottom: "calc(var(--split-descender) * -1)",
                }}
              >
                <motion.span
                  data-motion-guard=""
                  className={cn("inline-block", isAccent && "italic text-brass")}
                  variants={WORD}
                  custom={isAccent}
                >
                  {word}
                </motion.span>
              </span>
              {i < words.length - 1 ? " " : null}
            </span>
          );
        })}
      </motion.span>
    </Tag>
  );
}
