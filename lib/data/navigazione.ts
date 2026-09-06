// L'indice del sito.
//
// Dallo Step 07 non è più solo l'indice di una pagina: tre sezioni sono
// diventate pagine, e le voci sono quindi di due tipi — rotte e ancore nella
// home. `Ancora` distingue da sola, qui basta scrivere la destinazione.
//
// Vive in un posto solo perché la usano in tre — la barra, la tenda del menu
// e il footer — e tre elenchi che devono restare uguali finiscono sempre per
// divergere.

export interface VoceNav {
  /** Destinazione. Assente per le voci che aprono un pannello. */
  href?: string;
  /**
   * Azione al posto della destinazione. La carta è un pannello, non una
   * pagina: la voce di menu apre, non naviga. Chi disegna la voce guarda
   * questo campo e produce un `<button>` invece di un link — un link che
   * non porta da nessuna parte è un link rotto, anche quando funziona.
   */
  azione?: "carta";
  /** Chiave i18n nel namespace `nav`. */
  chiave: string;
}

/**
 * L'indice completo, nella tenda del menu e nel footer.
 * L'ordine è quello della partitura, non quello dell'importanza: chi apre il
 * menu sta cercando un posto nella sequenza che ha già visto scorrere.
 */
export const VOCI_NAV: readonly VoceNav[] = [
  { href: "/#famiglia", chiave: "famiglia" },
  { href: "/cantina", chiave: "cantina" },
  { href: "/#vino", chiave: "vino" },
  { azione: "carta", chiave: "carta" },
  { href: "/locali", chiave: "locali" },
  { href: "/#prenota", chiave: "prenota" },
];

/**
 * Le poche voci che stanno nella barra, accanto al wordmark.
 *
 * Erano sei, più un bottone «Prenota» che ripeteva la sesta, più l'hamburger
 * che conteneva già lo stesso indice per intero: tre modi di dire la stessa
 * cosa a dieci centimetri di distanza. Restano le due che portano a una
 * destinazione che la home non contiene — la cantina, che è il prodotto più
 * cercato per conto suo, e la carta, che è la domanda numero uno di chi deve
 * decidere dove cenare — più i contatti, che sono la fine del viaggio e
 * stanno in fondo a una pagina lunga diecimila pixel. Tutto il resto passa
 * dalla tenda.
 */
export const VOCI_BARRA: readonly VoceNav[] = [
  { href: "/cantina", chiave: "cantina" },
  { azione: "carta", chiave: "carta" },
  { href: "/#prenota", chiave: "contatti" },
];
