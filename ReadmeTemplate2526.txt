# Insegnamento di Tecnologie Web
# CdS In Informatica   
# (A.A. 2025-26)

# Progetto ArtAround 18-24 
 
# READ ME DEL PROGETTO ARTAROUND
_una copia IDENTICA di questo file deve trovarsi nella directory del progetto_

## Nome del gruppo: 
Fight Claude


## Membri del gruppo 
* Nome e cognome: `Nicholas Gulinelli`, matricola: `0001021646`, mail: `nicholas.gulinelli@studio.unibo.it`
* LLM (nome e versione e licenza): Claude Sonnet 5

_Il primo membro della lista verrà considerato come punto di contatto primario. Sarà la persona 
incaricata di spedire mail (sempre e solo dall'indirizzo studio.unibo.it) e tenere contatti con i docenti. Ogni mail deve sempre includere tutti i componenti del gruppo in cc, e deve essere indirizzata a tutti i docenti del corso:_ 

* fabio.vitali@unibo.it
* andrea.schimmenti2@unibo.it
* gianmarco.spinaci2@unibo.it
* remo.grillo@unibo.it

## Tipo progetto
18-24

## Data di disponibilità delle applicazioni
11/09/2026

## Locazione del progetto:

* URI del marketplace: https://site252645.tw.cs.unibo.it/editor/#selezione_museo
* URI del navigator: https://site252645.tw.cs.unibo.it/navigator/
* Altri URI rilevanti:

## Organizzazione dei sorgenti
* _creare una directory source all'interno della directory html_
* _Cambiare i permessi di accesso a questi file a 755 e 644_
* _Creare una directory per applicazione più una directory per la applicazione server-side_
* _Descrivere qui l'organizzazione interna di queste directory_

`source/` è divisa in tre cartelle, una per applicazione più il backend condiviso:

**`marketplace/`** — Editor/Marketplace contiene:
                     - in editor/index.html sono presenti tutte le viste in forma dichiarativa
                       (login, selezione museo, libreria, editor opera, editor visita mostrate tramite x-if/x-show)
                     - in editor/js/ sono presenti i moduli per ciascuna area dell'editor/marketplace,
                       app-store.js contiene lo stato globale condiviso   
                       gestoremusei.js gestisce la selezione del museo
                       gestorelibreria.js gestisce il catalogo di opere/artisti/tecniche/movimenti (items)                    
                       gestoreopera.js gestisce la creazione/modifica degli items
                       gestorevisita.js e gestorevisitaform.js gestiscono creazione modifica e pubblicazione delle visite
                       gestoremessaggi.js gestisce le notifiche custom (conferma o errore a seguito di azioni fatte nell'editor/marketplace)

**`navigator/`** - Navigator contiene:
                   - src/components/ contiene le viste principali (login, selezione visita, Header e Footer)
                   - Player/ + Player.jsx raggruppa tutto ciò che riguarda la riproduzione vera e propria della visita: 
                      avanzamento tra le tappe (Controlli.jsx, VistaIntermediaSala.jsx, VistaFineVisita.jsx e useVisitaNavigazione.js)
                      visualizzazione opera e contenuti opzionali (VistaOpera.jsx e VistaOperaOpzionale.jsx)
                      visualizzazione correlati (VistaCorrelato.jsx)
                      visualizzazione della mappa (Mappa.jsx)
                      riconoscimento e sintesi vocale + gestione dei comandi vocali su vocabolario controllato (MicrofonoButton.jsx, SpeechRec.jsx e SpeechSynt.jsx)                   

**`server/`** - Backend Express + Mongoose condiviso contiene:
                -models definisce gli schemi Mongoose (Item, Museo, Utente, Visita)
                -`routes/` le rotte REST corrispondenti, 
                 (voiceCommand.js) per l'inoltro dei comandi vocali ad una LLM esterna (Groq)
                -`data/` i file JSON usati per il popolamento del database






## Tecnologie utilizzate
_Inserire qui il linguaggio utilizzato, il o i framework utilizzati e ogni pacchetto NPM installato a parte quelli preinstallati_

#### Server-side
JavaScript, Express, Mongoose, cors, dotenv
#### Applicazione marketplace
JavaScript, Alpine.js, Bootstrap 5 (via CDN)
#### Applicazione navigator
JavaScript, react+Vite, Bootstrap 5 (via CDN)

## Contributo individuale
#### persona1: 
        -Server-side :  Architettura dei Modelli Mongoose, 
                        popolazione degli Item/Musei/Visite/Utenti (ad eccezione delle descrizioni delle opere e delle sale).
                        Architettura logica delle rotte e requisiti di funzionamento pensati per l'implementazione delle due applicazioni, Testing con curl
                        Testing su MongoDB Atlas in locale
        -Editor+Navigator : Architettura Logica
                            Architettura Visiva delle viste 
                            Requisiti funzionali, di usabilità e di sistema dell'applicazione
                            Collaudo e utilizzo dell'applicazione
                            Modifiche del codice Grafiche e Logiche mirate a risolvere specifici problemi o rendere più gradevole e funzionale la vista.
                            Testing sui possibili stati raggiungibili dal programma
#### LLM: 
        -Server-side : Generazione codice delle rotte API
        -Editor+Navigator : Generazione codice base
                            Debugging Sintattico, Aiuto nel Debugging Logico
                            Generazione Testi Descrittivi degli Item e delle sale
                            Spiegazione parti di codice tramite commenti
        -Groq utilizzata per il routing LLM, (modello utilizzato "model: 'openai/gpt-oss-20b'")



















