// Contratto di sicurezza del movimento: decide PRIMA del primo paint se le
// animazioni possono nascondere contenuto, e lo revoca se qualcosa va storto.

/**
 * Script bloccante iniettato nel <head>. Viene eseguito prima del primo paint,
 * non dopo l'idratazione: è la differenza fra "il testo appare" e "il testo
 * lampeggia e poi appare".
 *
 * Tre uscite di sicurezza, tutte necessarie:
 *  1. JS disattivo → l'attributo non viene mai scritto, il contenuto è visibile
 *  2. idratazione fallita → dopo 2s l'attributo viene revocato da solo
 *  3. prefers-reduced-motion → l'attributo non viene scritto, e viene revocato
 *     anche se l'utente cambia preferenza a pagina aperta
 *
 * Nessun altro punto del sistema ha il permesso di nascondere contenuto.
 */
const BOOT = `(function(){try{
var d=document.documentElement,m=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
function off(){d.removeAttribute('data-motion')}
if(m&&m.matches)return;
d.setAttribute('data-motion','on');
if(m&&m.addEventListener)m.addEventListener('change',function(e){if(e.matches)off()});
setTimeout(function(){if(!d.hasAttribute('data-hydrated'))off()},2000);
}catch(e){}})()`;

export function MotionBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
