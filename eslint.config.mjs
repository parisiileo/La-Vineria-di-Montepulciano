// Configurazione ESLint, formato flat.
//
// Fino a Next 15 questo file passava per `FlatCompat`, il ponte che traduce
// una configurazione in vecchio formato — `extends: "next/core-web-vitals"` —
// in configurazione flat. Da `eslint-config-next@16` quel ponte non serve e
// anzi non funziona: il pacchetto ESPORTA già config flat, e darle in pasto
// al traduttore produce un riferimento circolare
// («property 'react' closes the circle») che fa fallire ESLint prima ancora
// di leggere un file.
//
// Qui i due preset si importano e si sparpagliano, che è il modo previsto.

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // ------------------------------------------------ REGOLE DEL COMPILATORE
    // Next 16 accende le regole del React Compiler, che in Next 15 non
    // esistevano. Su questo codice segnalano cinque punti, tutti PRECEDENTI
    // alla migrazione e tutti dello stesso tipo:
    //
    //   Cursor, MappaLazy, MenuCurtain   `setState` dopo un `matchMedia`, cioè
    //                                    una domanda al browser che durante il
    //                                    render non si può fare
    //   PageTransition                   `setState` al cambio di rotta, che è
    //                                    esattamente il mestiere del componente
    //
    // Restano ACCESE ma come avvisi, non come errori. Due ragioni. La prima è
    // che nessuna delle cinque è un difetto osservabile: la pagina si comporta
    // oggi come si comportava ieri. La seconda è che la correzione giusta non
    // è una soppressione riga per riga ma un `useMediaQuery` costruito su
    // `useSyncExternalStore`, che tocca il cursore, la mappa e la tenda del
    // menu — tre componenti animati, da riverificare a occhio uno per uno.
    // È un lavoro suo, non una coda della migrazione, ed è annotato in
    // DA-VERIFICARE.md §15. Spegnerle del tutto vorrebbe dire perdere il
    // segnale; lasciarle come errori vorrebbe dire un `npm run check` rosso
    // per un debito che nessuno sta pagando adesso.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
