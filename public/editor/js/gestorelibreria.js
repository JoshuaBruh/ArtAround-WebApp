
// ==========================================
// LIBRERIA
// ==========================================
document.addEventListener('alpine:init', () => {

    Alpine.data('gestoreLibreria', () => ({
        tipo: 'opera',
        ordinaAlfabetico: false,
        menuVisitaApertoPer: null,
        bozzeDisponibili: [],
        caricamentoBozze: false,
        pagina: 1,
        perPagina: 12,
        totale: 0,
        pagineTotali: 1,
        elementi: [],
        mappaCorrelati: {},
        caricamento: false,
        filtroSala: '',
        ricerca: '',
        timerRicerca: null,

        async init() {
            this.$watch('tipo', () => {
                this.filtroSala = '';
                this.caricaLibreria(1);
            });

            this.$watch('ordinaAlfabetico', () => {
                this.caricaLibreria(1);
            });

            await this.caricaLibreria(1);

            this.$watch('ricerca', () => {
                clearTimeout(this.timerRicerca);
                this.timerRicerca = setTimeout(() => {
                    this.caricaLibreria(1);
                }, 300);
            });

            this.$watch('$store.app.museoSelezionato', (nuovoMuseo) => {
                if (nuovoMuseo) this.caricaLibreria(1);
            });
            this._onRicarica = () => this.caricaLibreria(this.pagina);
            window.addEventListener('ricarica-libreria', this._onRicarica);
        },

        cambiaSala(event) {
            this.filtroSala = event.target.value;
            this.caricaLibreria(1);
        },

        cambiaPagina(nuovaPagina) {
            if (nuovaPagina >= 1 && nuovaPagina <= this.pagineTotali) {
                this.caricaLibreria(nuovaPagina);
            }
        },


        async caricaLibreria(paginaDaCaricare = this.pagina) {
            const museo = Alpine.store('app').museoSelezionato;
            if (!museo) return;

            this.caricamento = true;
            this.pagina = paginaDaCaricare;

            try {
                const idMuseo = museo.id_museo || museo.id_oggetto || museo._id;
                let url = `/api/items?tipo=${this.tipo}&pagina=${this.pagina}&per_pagina=${this.perPagina}&id_museo=${encodeURIComponent(idMuseo)}`;

                // Se la checkbox A-Z è spuntata, la chiediamo al server
                if (this.ordinaAlfabetico) {
                    url += `&ordina=titolo_asc`;
                }
                if (this.tipo === 'opera' && this.filtroSala) {
                    url += `&id_sala=${encodeURIComponent(this.filtroSala)}`;
                }
                if (this.ricerca && this.ricerca.trim() !== '') {
                    url += `&ricerca=${encodeURIComponent(this.ricerca.trim())}`;
                }

                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                const data = await res.json();

                // I dati arrivano dal server già ordinati globalmente e paginati
                this.elementi = data.items || [];
                this.totale = data.totale || 0;
                this.pagineTotali = data.pagine_totali || 1;

                this.mappaCorrelati = {};
                (data.correlati || []).forEach(c => {
                    if (c.id_oggetto && c.titolo) {
                        if (c.id_oggetto) this.mappaCorrelati[c.id_oggetto] = c.titolo;
                        if (c._id) this.mappaCorrelati[String(c._id)] = c.titolo;
                    }
                });
            } catch (err) {
                console.error("Errore durante il caricamento della libreria:", err);
            } finally {
                this.caricamento = false;
            }
        },
        destroy() {
            window.removeEventListener('ricarica-libreria', this._onRicarica);
            clearTimeout(this.timerRicerca);
        },



        async apriMenuVisita(opera) {
            // Click sullo stesso bottone mentre è già aperto: chiude
            if (this.menuVisitaApertoPer === opera.id_oggetto) {
                this.menuVisitaApertoPer = null;
                return;
            }

            this.menuVisitaApertoPer = opera.id_oggetto;
            this.bozzeDisponibili = [];
            this.caricamentoBozze = true;

            try {
                const utente = Alpine.store('app').utente;
                const museo = Alpine.store('app').museoSelezionato;
                const idMuseo = museo?.id_museo || museo?._id;

                const res = await fetch(
                    `/api/visite?id_autore=${encodeURIComponent(utente.id_utente)}&id_museo=${encodeURIComponent(idMuseo)}&pubblicata=false`
                );
                if (res.ok) {
                    this.bozzeDisponibili = await res.json();
                }
            } catch (e) {
                console.error('Errore nel caricamento delle bozze:', e);
            } finally {
                this.caricamentoBozze = false;
            }
        },

        nuovaVisitaConOpera(opera) {
            this.menuVisitaApertoPer = null;
            Alpine.store('app').creaVisitaConOpera(opera);
        },

        async aggiungiOperaABozza(opera, bozza) {
            this.menuVisitaApertoPer = null;

            const giaPresente = (bozza.tappe || []).some(
                t => String(t.id_oggetto) === String(opera.id_oggetto)
            );
            if (giaPresente) {
                mostraMessaggio(`"${opera.titolo}" è già presente in "${bozza.titolo}".`, 'errore');
                return;
            }

            const nuoveTappe = [...(bozza.tappe || []), { id_oggetto: opera.id_oggetto, opzionale: false }];

            try {
                const res = await fetch(`/api/visite/${encodeURIComponent(bozza.id_visita)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tappe: nuoveTappe })
                });
                if (!res.ok) throw new Error('Salvataggio fallito');

                mostraMessaggio(`"${opera.titolo}" aggiunta a "${bozza.titolo}".`, 'successo');
            } catch (e) {
                console.error('Errore aggiunta tappa a bozza:', e);
                mostraMessaggio("Impossibile aggiungere l'opera alla bozza. Riprova.", 'errore');
            }
        },







        // Info della sala selezionata
        get salaSelezionataInfo() {
            if (!this.filtroSala) return null;
            const sale = Alpine.store('app').museoSelezionato?.struttura_sale;
            if (!sale) return null;

            if (Array.isArray(sale)) {
                return sale.find(s => s.id === this.filtroSala || s.id_sala === this.filtroSala) || null;
            }
            return sale[this.filtroSala] || null;
        },

        // Nome della sala per la card dell'opera
        getNomeSala(idSala) {
            if (!idSala) return 'Senza Sala';
            const sale = Alpine.store('app').saleDisponibili;
            if (!sale || !sale.length) return idSala;

            const info = sale.find(s => s.id === idSala || s.id_sala === idSala);
            return info?.nome || idSala;
        },

        getNomeCorrelato(id) {
            if (!id) return '';
            return this.mappaCorrelati[id] || id;
        },
        // Formatta in "Titolo (ID)"
        formattaCorrelato(id) {
            if (!id) return '';
            const titolo = this.mappaCorrelati[id];
            return titolo ? `${titolo} (${id})` : id;
        },


    }));
});
