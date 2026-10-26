// ==========================================
// MUSEI
// ==========================================
document.addEventListener('alpine:init', () => {

    Alpine.data('gestoreMusei', () => ({
        ricerca: '',
        cittaSelezionata: '',
        filtroCittaInput: '',
        menuCittaAperto: false,
        cittaDisponibili: [],
        musei: [],
        pagina: 1,
        perPagina: 6,
        pagineTotali: 1,
        totaleMusei: 0,
        contatoreRichieste: 0,
        caricamento: false,
        timerRicerca: null,

        async init() {
            await this.caricaCitta();
            await this.caricaMusei();

            // Un solo punto che ricarica ad ogni cambio filtro — niente più
            // doppia chiamata tra watch e handler sull'input/select in HTML
            this.$watch('ricerca', () => {
                clearTimeout(this.timerRicerca);
                this.timerRicerca = setTimeout(() => {
                    this.pagina = 1;
                    this.caricaMusei();
                }, 300);
            });

            this.$watch('cittaSelezionata', () => {
                this.pagina = 1;
                this.caricaMusei();
            });
        },

        get cittaFiltrate() {
            if (!this.filtroCittaInput.trim()) return this.cittaDisponibili;
            const q = this.filtroCittaInput.trim().toLowerCase();
            return this.cittaDisponibili.filter(c => c.toLowerCase().includes(q));
        },
        selezionaCitta(citta) {
            this.cittaSelezionata = citta;
            this.filtroCittaInput = citta;
            this.menuCittaAperto = false;
        },

        resetCitta() {
            this.cittaSelezionata = '';
            this.filtroCittaInput = '';
            this.menuCittaAperto = false;
        },

        async caricaCitta() {
            try {
                const res = await fetch('/api/musei/citta');
                if (res.ok) {
                    this.cittaDisponibili = await res.json();
                }
            } catch (e) {
                console.error('Errore nel caricamento delle città:', e);
            }
        },

        async caricaMusei() {
            const richiesta = ++this.contatoreRichieste;
            this.caricamento = true;
            try {
                const params = new URLSearchParams({
                    pagina: this.pagina,
                    per_pagina: this.perPagina,
                    citta: this.cittaSelezionata,
                    ricerca: this.ricerca
                });

                const res = await fetch(`/api/musei?${params.toString()}`);
                if (richiesta !== this.contatoreRichieste) return; // risposta obsoleta, scartala

                if (res.ok) {
                    const data = await res.json();
                    this.musei = data.musei;
                    this.pagina = data.pagina;
                    this.pagineTotali = data.pagineTotali;
                    this.totaleMusei = data.totale;
                }
            } catch (e) {
                console.error('Errore nel caricamento dei musei:', e);
            } finally {
                if (richiesta === this.contatoreRichieste) this.caricamento = false;
            }
        },

        paginaPrecedente() {
            if (this.pagina > 1) {
                this.pagina--;
                this.caricaMusei();
            }
        },

        paginaSuccessiva() {
            if (this.pagina < this.pagineTotali) {
                this.pagina++;
                this.caricaMusei();
            }
        },

        cambiaPagina(p) {
            if (p >= 1 && p <= this.pagineTotali) {
                this.pagina = p;
                this.caricaMusei();
            }
        }
    }));

});

