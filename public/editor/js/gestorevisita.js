// ==========================================
// CREAZIONE/MODIFICA VISITA
// ==========================================
document.addEventListener('alpine:init', () => {
    Alpine.data('gestoreVisita', () => ({
        ricerca: '',
        ordinamento: 'pubblicazione_asc',
        eModifica: false,
        mostraSubFormVisita: false,
        caricamentoVisite: false,
        visitaInDettaglio: null,
        mostraModalDettaglio: false,
        pagina: 1,
        perPagina: 6,
        formData: {
            id_visita: '',
            id_museo: '',
            id_autore: '',
            titolo: '',
            descrizione: '',
            durata_stimata_minuti: 30,
            prezzo_crediti: 0,
            immagine_copertina: '',
            tappe: []
        },

        async init() {
            this.$watch('ricerca', () => { this.pagina = 1; });
            this.$watch('ordinamento', () => { this.pagina = 1; });
            this.$watch('$store.app.vista', () => { this.pagina = 1; });
            // 1. Allinea subito l'ordinamento alla vista corrente all'avvio
            const vistaIniziale = Alpine.store('app').vista;
            this.ordinamento = (vistaIniziale === 'editorVisite') ? 'modifica_desc' : 'adozioni_desc';

            // 2. Carica le visite con l'ordinamento già corretto
            await this.caricaVisite();

            // 3. Eventi globali e watcher
            this._onRicaricaVisite = () => this.caricaVisite();
            window.addEventListener('ricarica-visite', this._onRicaricaVisite);
            this.$watch('$store.app.museoSelezionato', () => this.caricaVisite());

            // 4. UNICO WATCHER PER LA VISTA (aggiorna l'ordinamento E ricarica)
            this.$watch('$store.app.vista', (nuovaVista) => {
                this.ordinamento = (nuovaVista === 'editorVisite') ? 'modifica_desc' : 'adozioni_desc';
                this.caricaVisite();
            });
        },

        destroy() {
            window.removeEventListener('ricarica-visite', this._onRicaricaVisite);
        },


        async caricaVisite() {
            const museo = Alpine.store('app').museoSelezionato;
            const utente = Alpine.store('app').utente;
            const vista = Alpine.store('app').vista;

            if (!museo) return;

            this.caricamentoVisite = true;
            try {
                let url = `/api/visite?id_museo=${encodeURIComponent(museo.id_museo)}`;

                if (vista === 'mieVisite' && utente) {
                    url = `/api/visite/adottate/${encodeURIComponent(utente.id_utente)}`;
                } else if (vista === 'marketplace') {
                    url += '&pubblicata=true';
                } else if (vista === 'pubblicazioni' && utente) {
                    url += `&id_autore=${encodeURIComponent(utente.id_utente)}&pubblicata=true`;
                }
                if ((vista === 'pubblicazioni' || vista === 'marketplace' || vista === 'mieVisite') && utente) {
                    const r = await fetch(`/api/auth/utenti/${encodeURIComponent(utente.id_utente)}`);
                    if (r.ok) {
                        Object.assign(utente, await r.json());
                        localStorage.setItem('artaround_utente', JSON.stringify(utente));
                    }
                }

                const res = await fetch(url);
                if (res.ok) {
                    const dati = await res.json();
                    Alpine.store('app').elencoVisite = dati;
                } else {
                    console.error('Errore nel recupero delle visite dal server');
                }
            } catch (err) {
                console.error('Errore di connessione:', err);
            } finally {
                this.caricamentoVisite = false;
            }
        },

        get titoloPagina() {
            const v = Alpine.store('app').vista;
            if (v === 'editorVisite') return 'Le mie Bozze di Visite';
            if (v === 'pubblicazioni') return 'Le mie Visite Pubblicate';
            if (v === 'marketplace') return 'Marketplace Visite';
            if (v === 'mieVisite') return 'Le Mie Visite';
            return '';
        },

        get sottotitoloPagina() {
            const v = Alpine.store('app').vista;
            if (v === 'editorVisite') return 'Crea una Visita, ordina le tappe e pubblicala.';
            if (v === 'pubblicazioni') return 'I dati sulle tue visite pubblicate.';
            if (v === 'marketplace') return 'Sfoglia le visite e adotta quelle che ti piacciono.';
            if (v === 'mieVisite') return 'Le tue visite acquisite.';
            return '';
        },

        get visiteDaMostrare() {
            const vista = Alpine.store('app').vista;
            const utente = Alpine.store('app').utente;
            const museo = Alpine.store('app').museoSelezionato;
            const tutteLeVisite = Alpine.store('app').elencoVisite || [];

            if (!museo) return [];
            const idMuseoSelezionato = String(museo.id_museo);
            const idUtenteLoggato = utente ? String(utente.id_utente) : null;

            let filtrate = tutteLeVisite.filter(v => String(v.id_museo) === idMuseoSelezionato);

            filtrate = filtrate.filter(v => {
                const isPubblicata = v.pubblicata === true || v.pubblicata === 'true' || v.pubblicata === 1;
                const isAutore = idUtenteLoggato && String(v.id_autore) === idUtenteLoggato;

                if (vista === 'editorVisite') {
                    // Solo non pubblicate dell'utente loggato
                    return isAutore && !isPubblicata;
                }

                if (vista === 'pubblicazioni') {
                    // Solo visite pubblicate dall'utente loggato
                    return isAutore && isPubblicata;
                }

                if (vista === 'marketplace') {
                    // Tutte le pubblicate. Se c'è un utente loggato, esclude quelle create da lui
                    return isPubblicata && (!idUtenteLoggato || !isAutore);
                }

                if (vista === 'mieVisite') {
                    // Visite adottate dall'utente loggato
                    if (!utente || !utente.visite_adottate) return false;
                    const adottate = utente.visite_adottate.map(id => String(id));
                    return adottate.includes(String(v.id_visita));
                }

                return true;
            });


            if (this.ricerca.trim() !== '') {
                const q = this.ricerca.toLowerCase().trim();
                filtrate = filtrate.filter(v => {
                    const usernameAutore = typeof v.autore === 'object'
                        ? (v.autore?.username || v.autore?.nome || '')
                        : (v.username_autore || v.nome_autore || '');
                    return (v.titolo && v.titolo.toLowerCase().includes(q)) ||
                        (v.id_visita && String(v.id_visita).toLowerCase().includes(q)) ||
                        (v.descrizione && v.descrizione.toLowerCase().includes(q)) ||
                        (v.id_autore && String(v.id_autore).toLowerCase().includes(q)) ||
                        (usernameAutore && usernameAutore.toLowerCase().includes(q));
                });
            }


            filtrate.sort((a, b) => {
                // Ultima Modifica
                if (this.ordinamento === 'modifica_desc') {
                    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                }
                if (this.ordinamento === 'modifica_asc') {
                    return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0); // Invertiti
                }

                // Data Creazione
                if (this.ordinamento === 'creazione_desc') {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                }
                if (this.ordinamento === 'creazione_asc') {
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0); // Invertiti
                }

                // Data Pubblicazione
                if (this.ordinamento === 'pubblicazione_desc') {
                    return new Date(b.data_pubblicazione || b.createdAt || 0) - new Date(a.data_pubblicazione || a.createdAt || 0);
                }
                if (this.ordinamento === 'pubblicazione_asc') {
                    return new Date(a.data_pubblicazione || a.createdAt || 0) - new Date(b.data_pubblicazione || b.createdAt || 0); // Invertiti
                }

                // Adozioni & Titolo
                if (this.ordinamento === 'adozioni_desc') {
                    return (b.adozioni_totali || 0) - (a.adozioni_totali || 0);
                }
                if (this.ordinamento === 'titolo_asc') {
                    return (a.titolo || '').localeCompare(b.titolo || '');
                }
                return 0;
            });

            return filtrate;
        },
        get pagineTotali() {
            const totale = this.visiteDaMostrare.length;
            return Math.ceil(totale / this.perPagina) || 1;
        },

        get visitePaginate() {
            const inizio = (this.pagina - 1) * this.perPagina;
            const fine = inizio + this.perPagina;
            return this.visiteDaMostrare.slice(inizio, fine);
        },

        paginaPrecedente() {
            if (this.pagina > 1) this.pagina--;
        },
        paginaSuccessiva() {
            if (this.pagina < this.pagineTotali) this.pagina++;
        },
        cambiaPagina(p) {
            this.pagina = p;
        },

        getImmagineCopertina(visita) {
            if (visita.immagine_copertina && visita.immagine_copertina.trim() !== '') {
                return visita.immagine_copertina;
            }

            if (visita.tappe && visita.tappe.length > 0) {
                const idPrimaOpera = String(visita.tappe[0].id_oggetto);
                const opere = Alpine.store('app').opere || [];
                const primaOpera = opere.find(op => String(op.id_oggetto) === idPrimaOpera);

                if (primaOpera && primaOpera.immagine) {
                    return primaOpera.immagine;
                }
            }

            return '/media/placeholder.jpg';
        },


        async creaNuovaVisita() {
            window.dispatchEvent(new CustomEvent('apri-form-visita', {
                detail: { visita: null }
            }));
        },
        async modificaVisita(visita) {
            window.dispatchEvent(new CustomEvent('apri-form-visita', {
                detail: { visita: visita }
            }));
        },



        async pubblicaVisita(visita) {
            if (!visita.tappe || visita.tappe.length === 0) {
                mostraMessaggio('Non puoi pubblicare una visita senza tappe.', 'errore');
                return;
            }
            confermaAzione(`Vuoi pubblicare la visita "${visita.titolo}" nel marketplace?`, async () => {
                try {
                    const res = await fetch(`/api/visite/${encodeURIComponent(visita.id_visita)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pubblicata: true })
                    });

                    if (res.ok) {
                        mostraMessaggio('Visita pubblicata nel marketplace.', 'successo');
                        await this.caricaVisite();
                    } else {
                        const err = await res.json().catch(() => ({}));
                        mostraMessaggio(`Errore nella pubblicazione: ${err.errore || res.statusText}`, 'errore');
                    }
                } catch (e) {
                    console.error('Errore pubblicaVisita:', e);
                    mostraMessaggio('Errore di connessione durante la pubblicazione.', 'errore');
                }
            });
        },



        async spubblicaVisita(visita) {
            confermaAzione(`Vuoi ritirare la visita "${visita.titolo}" dalle pubblicazioni? Tornerà tra le bozze.`, async () => {
                try {
                    const res = await fetch(`/api/visite/${encodeURIComponent(visita.id_visita)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pubblicata: false })
                    });

                    if (res.ok) {
                        mostraMessaggio('Visita ritirata dal marketplace.', 'successo');
                        await this.caricaVisite();
                    } else {
                        const err = await res.json().catch(() => ({}));
                        mostraMessaggio(`Errore nello spubblicare: ${err.errore || res.statusText}`, 'errore');
                    }
                } catch (e) {
                    console.error('Errore spubblicaVisita:', e);
                    mostraMessaggio('Errore di connessione.', 'errore');
                }
            });
        },



        async eliminaVisita(id_visita) {
            confermaAzione('Sei sicuro di voler eliminare questa visita?', async () => {
                try {
                    const res = await fetch(`/api/visite/${encodeURIComponent(id_visita)}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        mostraMessaggio('Visita eliminata.', 'successo');
                        await this.caricaVisite();
                    } else {
                        const err = await res.json().catch(() => ({}));
                        mostraMessaggio(`Impossibile eliminare: ${err.errore || res.statusText}`, 'errore');
                    }
                } catch (e) {
                    console.error('Errore eliminaVisita:', e);
                    mostraMessaggio("Errore di connessione durante l'eliminazione.", 'errore');
                }
            });
        },



        async adottaVisita(visita) {
            const utente = Alpine.store('app').utente;
            if (!utente) {
                mostraMessaggio('Devi effettuare il login per adottare una visita.', 'errore'); return;
            }

            if (utente.credito < visita.prezzo_crediti) {
                mostraMessaggio(`Credito insufficiente. La visita costa ${visita.prezzo_crediti} crediti, ma ne possiedi ${utente.credito}.`, 'errore'); return;
            }

            confermaAzione(`Vuoi adottare la visita "${visita.titolo}" per ${visita.prezzo_crediti} crediti?`, async () => {
                try {
                    const res = await fetch(`/api/visite/${encodeURIComponent(visita.id_visita)}/adotta`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_utente: utente.id_utente })
                    });

                    if (res.ok) {
                        const risposta = await res.json();

                        if (risposta.credito_residuo !== undefined) {
                            utente.credito = risposta.credito_residuo;
                        }
                        if (risposta.visite_adottate) {
                            utente.visite_adottate = risposta.visite_adottate;
                        }
                        localStorage.setItem('artaround_utente', JSON.stringify(utente));
                        mostraMessaggio(risposta.messaggio || 'Visita adottata con successo!', 'successo'); await this.caricaVisite();
                    } else {
                        const err = await res.json().catch(() => ({}));
                        mostraMessaggio(`Impossibile adottare la visita: ${err.errore || res.statusText}`, 'errore');
                    }
                } catch (e) {
                    console.error('Errore adottaVisita:', e);
                    mostraMessaggio("Errore di connessione durante l'adozione.", 'errore');
                }
            });
        },

        apriDettaglioVisita(visita) {
            this.visitaInDettaglio = visita;
            this.mostraModalDettaglio = true;
        },

        chiudiDettaglioVisita() {
            this.visitaInDettaglio = null;
            this.mostraModalDettaglio = false;
        },

        // Recupera gli oggetti 'opera' completi partendo dagli ID presenti in visita.tappe
        getOpereDettaglio() {
            if (!this.visitaInDettaglio || !this.visitaInDettaglio.tappe) return [];

            const tutteOpere = Alpine.store('app').opere || [];
            return this.visitaInDettaglio.tappe
                .map(tappa => tutteOpere.find(op => String(op.id_oggetto) === String(tappa.id_oggetto)))
                .filter(Boolean); // Rimuove eventuali elementi undefined
        },

        formattaCorrelato(id) {
            if (!id) return '';

            // Cerca prima tra gli artisti caricati globalmente
            const artista = (Alpine.store('app').artisti || []).find(a => String(a.id_oggetto) === String(id) || String(a.id_artista) === String(id));
            if (artista) return (artista.titolo || artista.nome || id);

            // Fallback: cerca nell'array opere/correlati
            const item = (Alpine.store('app').opere || []).find(o => String(o.id_oggetto) === String(id));
            return item && item.titolo ? (item.titolo + ' (' + id + ')') : id;
        },
        async avviaNavigator(id_visita) {
            const utente = Alpine.store('app').utente;
            if (!utente) return;
            const url = `/navigator/?visita=${encodeURIComponent(id_visita)}&utente=${encodeURIComponent(utente.id_utente)}`;
            window.open(url, '_blank')
        }
    }));
});