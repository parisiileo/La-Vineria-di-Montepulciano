// Calcolo del contrasto WCAG 2.1. Serve a stampare rapporti reali nella
// kitchen-sink e a far fallire l'audit quando un token scende sotto soglia.

export type Hex = `#${string}`;

const channels = (hex: Hex): [number, number, number] => {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const parts = full.match(/../g) ?? [];
  return [
    parseInt(parts[0] ?? "0", 16) / 255,
    parseInt(parts[1] ?? "0", 16) / 255,
    parseInt(parts[2] ?? "0", 16) / 255,
  ];
};

const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Luminanza relativa secondo WCAG 2.1. */
export function luminance(hex: Hex): number {
  const [r, g, b] = channels(hex).map(linearize) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapporto di contrasto fra due colori opachi, da 1 a 21. */
export function contrast(a: Hex, b: Hex): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composita un colore con alpha su un fondo opaco: serve per i bordi. */
export function flatten(fg: Hex, alpha: number, bg: Hex): Hex {
  const f = channels(fg);
  const b = channels(bg);
  const mix = f.map((v, i) => Math.round((v * alpha + (b[i] ?? 0) * (1 - alpha)) * 255));
  return `#${mix.map((v) => v.toString(16).padStart(2, "0")).join("")}` as Hex;
}

export type ContrastVerdict = "aa" | "aa-large" | "fail";

/** Verdetto WCAG: 4.5 per il testo normale, 3.0 per testo grande e non-testo. */
export function verdict(ratio: number): ContrastVerdict {
  if (ratio >= 4.5) return "aa";
  if (ratio >= 3) return "aa-large";
  return "fail";
}
