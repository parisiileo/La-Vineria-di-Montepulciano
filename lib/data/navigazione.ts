// L'indice della partitura.
//
// Sono ancore interne e non rotte: il sito è una pagina sola, e la
// navigazione serve a saltare dentro la sequenza, non a cambiare documento.
// Vive qui e non nel layout perché la usano in due — la barra e il footer — e
// due elenchi che devono restare uguali finiscono sempre per divergere.

export interface VoceNav {
  href: string;
  /** Chiave i18n nel namespace `nav`. */
  chiave: string;
}

export const VOCI_NAV: readonly VoceNav[] = [
  { href: "#famiglia", chiave: "famiglia" },
  { href: "#cantina", chiave: "cantina" },
  { href: "#vino", chiave: "vino" },
  { href: "#cucina", chiave: "cucina" },
  { href: "#locali", chiave: "locali" },
  { href: "#prenota", chiave: "prenota" },
];
