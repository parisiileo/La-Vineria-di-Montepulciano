# Da verificare col cliente

Elenco unico di tutto ciò che il sito **non** afferma perché nessuno lo ha
confermato. Ogni voce ha un posto preciso nel codice: quando la risposta
arriva, si cambia lì e l'interfaccia si accende da sola.

La regola che genera questo file è una sola, e vale per tutto il progetto:
**su un'attività reale non si pubblica un dato plausibile al posto di un dato
vero.** Un orario inventato manda qualcuno davanti a una porta chiusa; un
prezzo inventato è una promessa che si presenta al tavolo; un tag «senza
glutine» inventato è un problema clinico.

---

## 1. Il copy della sezione «La famiglia» — la più importante

Il brief dello Step 04 chiede questo testo:

> **Da decenni sullo stesso corso**
> Non abbiamo aperto ieri. Gli Ercolani stanno a Montepulciano da generazioni,
> e da generazioni fanno la stessa cosa: coltivare, vinificare, e apparecchiare.
> Prima è arrivata la cantina. Poi il primo locale, al 101. Poi il secondo, al 72.

Non è stato pubblicato, e non per timidezza: **il sito attuale del cliente si
descrive con parole opposte** — «siamo un team di giovani amici, cresciuti
insieme tra le colline toscane». `ANNO_FONDAZIONE` è `null`. «Da decenni» e
«da generazioni» sono affermazioni verificabili, e finché le due fonti si
contraddicono pubblicarne una è una scelta, non una traduzione.

Anche l'**ordine delle aperture** (prima la cantina, poi il 101, poi il 72) è
un fatto, e nessuno lo ha confermato.

**In linea oggi:** «Cresciuti su *questo* corso», con i fatti confermati —
la scala che scende in cantina al 101, il pozzo medievale sotto il vetro al 72.

**Da chiedere:** l'anno o il decennio di apertura, se la famiglia è a
Montepulciano da più generazioni, e in che ordine sono nati cantina, 101 e 72.
Confermato l'anno, il testo del brief entra così com'è.

→ `messages/{it,en}.json` · `home.famiglia` · `lib/data/locali.ts` `ANNO_FONDAZIONE`

## 2. Valutazione e recensioni

«4,5 su 5 — oltre 5.500 recensioni» arriva dal brief e non è stata verificata
su nessuna fonte. È in pagina dietro una sola costante, così si corregge o si
toglie con una riga.

**Da chiedere:** media, numero e **piattaforma** (Google? TripAdvisor?
TheFork? la somma di tutte?). Un numero senza la sua fonte, su un dato di
reputazione, non è pubblicabile a lungo.

→ `lib/data/locali.ts` `VALUTAZIONE_DA_VERIFICARE` · `messages` `home.hero.valutazione`

## 3. Orari di apertura

`orari: null` per entrambe le sedi. Il badge di stato è già scritto e calcola
in fuso `Europe/Rome`; finché il dato manca dice «Orari in aggiornamento ·
Chiamaci per conferma».

**Da chiedere:** giorni e fasce di ciascuna sede, chiusure settimanali,
stagionalità. Il formato che il codice si aspetta è in `Fascia`: giorni
(0 = domenica) e minuti dalla mezzanotte, con le chiusure a notte espresse
oltre 1440.

→ `lib/data/locali.ts` `LOCALI[].orari`

## 4. Prezzi della carta

Tutte le voci hanno `prezzo: null` e mostrano «Prezzo al tavolo». I punti di
guida tipografici sono già al loro posto e aspettano solo i numeri.

**Da chiedere:** il listino. In centesimi, per evitare i decimali in virgola
mobile.

→ `lib/data/menu.ts` `CARTA[].prezzo`

## 5. Tag dietetici e allergeni — **questione di sicurezza, non di interfaccia**

`TAG_CONFERMATI = false`. Sono marcati `vegetariano` solo i piatti in cui la
carne non compare in nessuna versione conosciuta della ricetta: pici
all'aglione, tagliatelle, ribollita, Cantuccimisù, panna cotta. **Nessun
piatto è marcato senza glutine**, perché non lo sappiamo e chi filtra per quel
tag lo fa per necessità medica.

**Da chiedere e da confermare piatto per piatto:** brodi e fondi (la ribollita
è vegetariana davvero?), il caglio dei pecorini, la presenza di uova nella
pasta fatta in casa, e quali piatti sono realmente senza glutine o
adattabili.

→ `lib/data/menu.ts` `CARTA[].tag`, `TAG_CONFERMATI`

## 6. Abbinamenti dei vini

I consigli in carta (Il Brillo, Rosso, Nobile, Vin Santo) sono proposti, non
confermati: sono un consiglio della casa, e la casa non li ha ancora dati.

→ `lib/data/menu.ts` `CARTA[].abbinamento`

## 7. Dove devono arrivare le prenotazioni

Il modulo esiste, valida e invia. La rotta `/api/prenota` valida di nuovo e
inoltra a `PRENOTAZIONI_WEBHOOK`. **Quella variabile non è configurata**,
quindi la rotta risponde 503 e l'interfaccia dice che la richiesta non è
partita e rimanda al telefono.

Non c'è un ramo che ringrazi senza aver spedito niente: un «grazie, vi
richiamiamo» che non arriva a nessuno è la bugia più costosa che un sito di
ristorante possa raccontare.

**Da chiedere:** una casella email, un numero WhatsApp Business, o il
gestionale in uso.

→ `app/api/prenota/route.ts` · variabile d'ambiente `PRENOTAZIONI_WEBHOOK`

## 8. TheFork

`THEFORK_URL = null`, e il link non compare. Un collegamento alla scheda
sbagliata manda le prenotazioni a un altro ristorante.

**Da chiedere:** l'URL del profilo, se esiste.

→ `lib/data/locali.ts` `THEFORK_URL`

## 9. Social e dati legali

`SOCIAL` è vuoto e `PARTITA_IVA` è `null`: il blocco corrispondente del footer
non viene disegnato. I profili clone di locali toscani esistono, e linkarne
uno è un danno reputazionale.

**Da chiedere:** gli account ufficiali e la ragione sociale completa con la
partita IVA — quest'ultima è anche un obbligo di legge per un sito
commerciale.

→ `lib/data/locali.ts` `SOCIAL`, `PARTITA_IVA`

## 10. Coordinate esatte e mappa

`coordinate: null` per entrambe le sedi. La mappa è quindi una **veduta senza
segnaposto**: l'inquadratura è costruita sulla geometria che OpenStreetMap ha
di Via di Gracciano nel Corso, e i link «Indicazioni» cercano l'indirizzo per
esteso — che è il dato che conosciamo davvero.

**Da chiedere:** la posizione esatta delle due porte, o anche solo un
segnaposto condiviso da Google Maps. Con quello arrivano il pin sulla mappa e
il campo `geo` in JSON-LD.

→ `lib/data/locali.ts` `LOCALI[].coordinate` · `components/chrome/MappaLazy.tsx`

## 11. La cantina: profondità, estensione, gratuità della visita

`profonditaMetri`, `estensioneMetri` e `tourGratuito` sono `null`. Il testo
della sezione parla di tunnel medievali visitabili — che è confermato — e non
dà una sola misura.

**Da chiedere:** quanto si scende, quanto sono lunghi i tunnel, se la visita è
gratuita o inclusa nella degustazione, e se serve prenotare.

→ `lib/data/locali.ts` `SOTTOSUOLO`

## 12. La sede di Cortona

`SEDE_CORTONA_CONFERMATA = false`, quindi nessuna interfaccia la nomina. Allo
Step 02 era stato trovato un riferimento a Piazza Luca Signorelli 28, Cortona,
sui materiali del cliente.

**Da chiedere:** esiste, è attiva, è la stessa gestione? Se sì, la partitura
dei «due locali» diventa tre e la sezione va ripensata, non allargata.

→ `lib/data/locali.ts` `SEDE_CORTONA_CONFERMATA`

## 13. Fotografie mancanti

Vedi `FOTOGRAFIE-DA-FARE.md`: due soggetti critici non esistono nella libreria
del cliente, ed è il motivo per cui la sezione della cantina è tipografica.
