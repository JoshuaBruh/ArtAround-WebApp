document.addEventListener('alpine:init', () => {
    Alpine.store('app', {
        utente: null,
        museoSelezionato: null,
        opere: [],
        artisti: [],
        movimenti: [],
        tecniche: [],
        operaFormData: null,
        elencoVisite: [],
        itemInModifica: null,
        caricamentoOpere: false,
        vista: 'selezione_museo',
        erroreLogin: '',
        formLogin: { username: '', password: '' },



        getMuseoPuro() {
            return this.museoSelezionato ? JSON.parse(JSON.stringify(this.museoSelezionato)) : null;
        },

        async init() {
            const utenteSalvato = localStorage.getItem('artaround_utente');
            if (utenteSalvato) {
                try {
                    this.utente = JSON.parse(utenteSalvato);
                    this.caricaEntita();
                } catch (e) {
                    console.error("Dati utente corrotti in localStorage:", e);
                    localStorage.removeItem('artaround_utente');
                }
            }
            // 2. Ripristina Museo Selezionato se presente in localStorage
            const museoSalvato = localStorage.getItem('artaround_museo');
            if (museoSalvato) {
                try {
                    this.museoSelezionato = JSON.parse(museoSalvato);
                    await this.caricaOpere();
                } catch (e) {
                    console.error("Dati museo corrotti in localStorage:", e);
                    localStorage.removeItem('artaround_museo');
                }
            }

            // 3. Ripristina Vista se presente, altrimenti 'selezione_museo'
            const hashInUrl = window.location.hash.replace('#', '');
            const vistaSalvata = localStorage.getItem('artaround_vista');

            if (hashInUrl && this.utente) {
                this.vista = hashInUrl;
            } else if (vistaSalvata && this.utente) {
                this.vista = vistaSalvata;
            } else {
                this.vista = 'selezione_museo';
            }

            // Rete di sicurezza: un hash sconosciuto torna al default
            const VISTE_AUTORE = ['libreria', 'creaContenuto', 'editorVisite', 'pubblicazioni'];
            const VISTE_VISITATORE = ['marketplace', 'mieVisite'];
            const VISTE_VALIDE = ['selezione_museo', 'dettaglio_museo', ...VISTE_AUTORE, ...VISTE_VISITATORE];
            if (!VISTE_VALIDE.includes(this.vista)) this.vista = 'selezione_museo';

            // Coerenza tra le due sorgenti di verità: vista vs museoSelezionato
            if (this.museoSelezionato && this.vista === 'selezione_museo') {
                this.vista = 'dettaglio_museo';
            } else if (!this.museoSelezionato && this.vista !== 'selezione_museo') {
                this.vista = 'selezione_museo';
            }

            // Un visitatore non apre viste da autore, e viceversa
            if (this.utente?.ruolo === 'visitatore' && VISTE_AUTORE.includes(this.vista)) {
                this.vista = 'marketplace';
            }
            if (this.utente?.ruolo === 'autore' && VISTE_VISITATORE.includes(this.vista)) {
                this.vista = 'libreria';
            }

            history.replaceState(
                { vista: this.vista, museoSelezionato: this.getMuseoPuro() },
                '',
                `#${this.vista}`
            );

            // 4. Ascolta il tasto "Indietro" e "Avanti" del Browser
            window.addEventListener('popstate', async (event) => {
                if (event.state && event.state.vista) {
                    this.vista = event.state.vista;

                    // Ripristina il museo dallo stato o dal localStorage
                    if (event.state.museoSelezionato) {
                        this.museoSelezionato = event.state.museoSelezionato;
                        localStorage.setItem('artaround_museo', JSON.stringify(this.museoSelezionato));
                        await this.caricaOpere();
                    } else if (this.vista === 'selezione_museo') {
                        this.museoSelezionato = null;
                        localStorage.removeItem('artaround_museo');
                    }
                } else {
                    // Fallback se l'utente torna fino all'URL base
                    const hash = window.location.hash.replace('#', '');
                    this.vista = hash || 'selezione_museo';
                }

                localStorage.setItem('artaround_vista', this.vista);
            });
        },

        async login() {
            this.erroreLogin = '';
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.formLogin)
                });
                const data = await res.json();

                if (res.ok) {
                    this.utente = data; // Salva l'utente nello store
                    localStorage.setItem('artaround_utente', JSON.stringify(data));
                    this.caricaEntita();
                    if (this.museoSelezionato) {
                        this.NuovaVista('dettaglio_museo');
                    } else {
                        this.NuovaVista('selezione_museo');
                    }
                } else {
                    this.erroreLogin = data.errore || 'Credenziali errate';
                }
            } catch (e) {
                this.erroreLogin = 'Errore di connessione al server Express';
            }
        },

        async selezionaMuseo(museo) {
            if (!museo) {
                this.museoSelezionato = null;
                this.opere = [];
                localStorage.removeItem('artaround_museo');
                this.NuovaVista('selezione_museo');
                return;
            }

            try {
                const idMuseo = museo.id_museo;
                //Chiamata alla rotta di dettaglio GET /api/musei/:id
                const res = await fetch(`/api/musei/${idMuseo}`);
                if (res.ok) {
                    const museoCompleto = await res.json();
                    this.museoSelezionato = museoCompleto;
                    localStorage.setItem('artaround_museo', JSON.stringify(museoCompleto));
                    await this.caricaOpere();
                    this.NuovaVista('dettaglio_museo');
                } else {
                    mostraMessaggio('Impossibile aprire questo museo. Riprova.', 'errore');
                }
            } catch (e) {
                console.error('Errore durante il recupero dei dettagli del museo:', e);
                mostraMessaggio('Errore di connessione durante il caricamento del museo.', 'errore');
            }
        },

        cambiaMuseo() {
            this.selezionaMuseo(null);
        },


        NuovaVista(nV, salvaInCronologia = true) {
            this.vista = nV;
            localStorage.setItem('artaround_vista', nV);

            if (salvaInCronologia) {
                const museoPuro = this.getMuseoPuro();
                history.pushState(
                    { vista: nV, museoSelezionato: museoPuro },
                    '',
                    `#${nV}`
                );
            }
        },


        async caricaEntita() {
            const LIMITE_ENTITA_PER_TENDINE = 1000;
            try {
                const [resArtisti, resMovimenti, resTecniche] = await Promise.all([
                    fetch(`/api/items?tipo=artista&per_pagina=${LIMITE_ENTITA_PER_TENDINE}`),
                    fetch(`/api/items?tipo=movimento&per_pagina=${LIMITE_ENTITA_PER_TENDINE}`),
                    fetch(`/api/items?tipo=tecnica&per_pagina=${LIMITE_ENTITA_PER_TENDINE}`)
                ]);

                if (resArtisti.ok) {
                    const data = await resArtisti.json();
                    this.artisti = (data.items || []).sort((a, b) => (a.titolo || '').localeCompare(b.titolo || '', 'it', { sensitivity: 'base' }));
                }
                if (resMovimenti.ok) {
                    const data = await resMovimenti.json();
                    this.movimenti = (data.items || []).sort((a, b) => (a.titolo || '').localeCompare(b.titolo || '', 'it', { sensitivity: 'base' }));
                }
                if (resTecniche.ok) {
                    const data = await resTecniche.json();
                    this.tecniche = (data.items || []).sort((a, b) => (a.titolo || '').localeCompare(b.titolo || '', 'it', { sensitivity: 'base' }));
                }
                if (!resArtisti.ok || !resMovimenti.ok || !resTecniche.ok) {
                    mostraMessaggio('Alcuni contenuti non sono stati caricati correttamente.', 'errore');
                }
            } catch (err) {
                console.error('Errore nel caricamento delle entità:', err);
                mostraMessaggio('Errore di connessione durante il caricamento dei contenuti.', 'errore');
            }
        },


        async caricaOpere() {
            if (!this.museoSelezionato) {
                this.opere = [];
                return;
            }
            this.caricamentoOpere = true;
            try {
                const idMuseo = this.museoSelezionato.id_museo;
                const res = await fetch(`/api/items?tipo=opera&id_museo=${encodeURIComponent(idMuseo)}&per_pagina=500`);
                if (res.ok) {
                    const data = await res.json();
                    this.opere = data.items || [];
                } else {
                    mostraMessaggio('Impossibile caricare le opere del museo.', 'errore');
                }
            } catch (errore) {
                console.error("Errore nel caricamento delle opere:", errore);
                mostraMessaggio('Errore di connessione durante il caricamento delle opere.', 'errore');
            } finally {
                this.caricamentoOpere = false;
            }
        },

        get saleDisponibili() {
            const saleObj = this.museoSelezionato?.struttura_sale;
            if (!saleObj) return [];

            return Object.entries(saleObj).map(([id, info]) => ({
                id: id,
                ...(typeof info === 'object' ? info : { nome: info })
            }));
        },

        modificaOpera(item) {
            this.itemInModifica = item;
            this.NuovaVista('creaContenuto');
        },

        logout() {
            this.utente = null;
            this.museoSelezionato = null;

            localStorage.removeItem('artaround_utente');
            localStorage.removeItem('artaround_museo');
            localStorage.removeItem('artaround_vista');

            this.NuovaVista('selezione_museo');
        },

        creaVisitaConOpera(opera) {
            window.dispatchEvent(new CustomEvent('apri-form-visita', {
                detail: { visita: null, operaDaPreAggiungere: opera }
            }));
        }
    });
});
