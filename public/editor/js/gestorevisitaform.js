// ==========================================
// GESTORE FORM DI CREAZIONE / MODIFICA VISITA
// ==========================================
document.addEventListener('alpine:init', () => {
    Alpine.data('gestoreFormVisita', () => ({
        mostraSubFormVisita: false,
        eModifica: false,
        idOggettoSelezionato: '',

        filtroTesto: '',
        filtroSala: '',
        filtroArtista: '',
        filtroTecnica: '',
        filtroMovimento: '',

        subFormData: {
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


        async init() { },


        get catalogoOpereBase() {
            return (Alpine.store('app').opere || []).filter(op => !op.tipo || op.tipo === 'opera');
        },

        get opzioniSale() {
            const idsUsati = new Set(this.catalogoOpereBase.map(op => op.id_sala).filter(Boolean));
            return (Alpine.store('app').saleDisponibili || [])
                .filter(s => idsUsati.has(s.id))
                .map(s => ({ id: s.id, nome: s.nome || s.id }))
                .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
        },

        get opzioniArtisti() {
            const idsUsati = new Set(this.catalogoOpereBase.map(op => op.id_artista).filter(Boolean));
            return (Alpine.store('app').artisti || [])
                .filter(a => idsUsati.has(a.id_oggetto))
                .map(a => ({ id: a.id_oggetto, nome: a.titolo || a.id_oggetto }))
                .sort((a, b) => a.nome.localeCompare(b.nome));
        },

        get opzioniTecniche() {
            const idsUsati = new Set(this.catalogoOpereBase.map(op => op.id_tecnica).filter(Boolean));
            return (Alpine.store('app').tecniche || [])
                .filter(t => idsUsati.has(t.id_oggetto))
                .map(t => ({ id: t.id_oggetto, nome: t.titolo || t.id_oggetto }))
                .sort((a, b) => a.nome.localeCompare(b.nome));
        },

        get opzioniMovimenti() {
            const idsUsati = new Set(this.catalogoOpereBase.map(op => op.id_movimento).filter(Boolean));
            return (Alpine.store('app').movimenti || [])
                .filter(m => idsUsati.has(m.id_oggetto))
                .map(m => ({ id: m.id_oggetto, nome: m.titolo || m.id_oggetto }))
                .sort((a, b) => a.nome.localeCompare(b.nome));
        },


        get opereFiltrate() {
            const q = this.filtroTesto.trim().toLowerCase();
            return this.catalogoOpereBase.filter(op => {
                if (q && !((op.titolo || '').toLowerCase().includes(q) || (op.id_oggetto || '').toLowerCase().includes(q))) return false;
                if (this.filtroSala && String(op.id_sala) !== String(this.filtroSala)) return false;
                if (this.filtroArtista && op.id_artista !== this.filtroArtista) return false;
                if (this.filtroTecnica && op.id_tecnica !== this.filtroTecnica) return false;
                if (this.filtroMovimento && op.id_movimento !== this.filtroMovimento) return false;
                return true;
            });
        },


        resetFiltriOpere() {
            this.filtroTesto = '';
            this.filtroSala = '';
            this.filtroArtista = '';
            this.filtroTecnica = '';
            this.filtroMovimento = '';
            this.idOggettoSelezionato = '';
        },





        apriSubFormVisita(visita = null) {
            const museo = Alpine.store('app').museoSelezionato;
            const utente = Alpine.store('app').utente;

            if (visita) {
                this.eModifica = true;
                this.subFormData = JSON.parse(JSON.stringify(visita));
                if (!Array.isArray(this.subFormData.tappe)) {
                    this.subFormData.tappe = [];
                }
            } else {
                this.eModifica = false;
                this.subFormData = {
                    id_visita: 'visita_' + Date.now(),
                    id_museo: museo ? String(museo.id_museo) : '',
                    id_autore: utente ? String(utente.id_utente) : '',
                    titolo: '',
                    descrizione: '',
                    durata_stimata_minuti: 30,
                    prezzo_crediti: 0,
                    immagine_copertina: '',
                    tappe: []
                };
            }

            this.mostraSubFormVisita = true;
        },
        chiudiSubForm() {
            this.mostraSubFormVisita = false;
            this.eModifica = false;
            this.resetFiltriOpere();
        },



        aggiungiTappa(id_oggetto) {
            if (!id_oggetto) return;

            const giaPresente = this.subFormData.tappe.some(t => String(t.id_oggetto) === String(id_oggetto));
            if (giaPresente) {
                mostraMessaggio('Questa opera è già stata aggiunta alla visita.', 'errore');
                return;
            }
            this.subFormData.tappe.push({
                id_oggetto: String(id_oggetto),
                opzionale: false
            });
        },

        rimuoviTappa(index) {
            if (index >= 0 && index < this.subFormData.tappe.length) {
                this.subFormData.tappe.splice(index, 1);
            }
        },

        spostaTappa(index, direzione) {
            // direzione: -1 per spostare su, +1 per spostare giù
            const targetIndex = index + direzione;

            if (targetIndex < 0 || targetIndex >= this.subFormData.tappe.length) {
                return; // Fuori dai limiti dell'array
            }

            // Scambio delle posizioni
            const tappe = [...this.subFormData.tappe];
            const temp = tappe[index];
            tappe[index] = tappe[targetIndex];
            tappe[targetIndex] = temp;
            this.subFormData.tappe = tappe;
        },

        ordinaTappeperSala() {
            const tutteOpere = Alpine.store('app').opere || [];
            const mappaOpere = new Map(tutteOpere.map(op => [String(op.id_oggetto), op.id_sala || '']));

            const tappeOrdinate = [...this.subFormData.tappe].sort((a, b) => {
                const salaA = String(mappaOpere.get(String(a.id_oggetto)) || '');
                const salaB = String(mappaOpere.get(String(b.id_oggetto)) || '');

                if (!salaA && !salaB) return 0;
                if (!salaA) return 1;
                if (!salaB) return -1;
                return salaA.localeCompare(salaB, undefined, { numeric: true, sensitivity: 'base' });
            });
            this.subFormData.tappe = tappeOrdinate;

        },




        async salvaBozza() {
            if (!this.subFormData.titolo.trim()) {
                mostraMessaggio('Inserisci un titolo per la visita.', 'errore');
                return;
            }

            if (!this.subFormData.id_museo || !this.subFormData.id_autore) {
                mostraMessaggio('Museo o Autore non definiti.', 'errore');
                return;
            }

            const url = this.eModifica
                ? `/api/visite/${encodeURIComponent(this.subFormData.id_visita)}`
                : '/api/visite';

            const method = this.eModifica ? 'PUT' : 'POST';

            const payload = {
                id_visita: this.subFormData.id_visita,
                id_museo: this.subFormData.id_museo,
                id_autore: this.subFormData.id_autore,
                titolo: this.subFormData.titolo,
                descrizione: this.subFormData.descrizione,
                durata_stimata_minuti: this.subFormData.durata_stimata_minuti,
                prezzo_crediti: this.subFormData.prezzo_crediti,
                immagine_copertina: this.subFormData.immagine_copertina,
                tappe: this.subFormData.tappe
            };

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    // Notifica o ricarica l'elenco delle visite
                    window.dispatchEvent(new CustomEvent('ricarica-visite'));
                    mostraMessaggio(`Bozza ${this.eModifica ? 'aggiornata' : 'salvata'}.`, 'successo');
                    this.chiudiSubForm();
                } else {
                    const err = await res.json().catch(() => ({}));
                    mostraMessaggio(`Errore nel salvataggio: ${err.errore || res.statusText}`, 'errore');
                }
            } catch (e) {
                console.error('Errore salvaBozza:', e);
                mostraMessaggio('Errore di connessione durante il salvataggio.', 'errore');
            }
        },




        async eliminaSubForm() {
            const idVisita = this.subFormData.id_visita;
            if (!idVisita || !this.eModifica) return;

            confermaAzione(`Sei sicuro di voler eliminare la visita "${this.subFormData.titolo || idVisita}"?`, async () => {

                try {
                    const res = await fetch(`/api/visite/${encodeURIComponent(idVisita)}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        window.dispatchEvent(new CustomEvent('ricarica-visite'));
                        mostraMessaggio('Visita eliminata.', 'successo');
                        this.chiudiSubForm();
                    } else {
                        const err = await res.json().catch(() => ({}));
                        mostraMessaggio(`Impossibile eliminare: ${err.errore || res.statusText}`, 'errore');
                    }
                } catch (e) {
                    console.error('Errore eliminaSubForm:', e);
                    mostraMessaggio('Errore di connessione durante l\'eliminazione.', 'errore');
                }
            });
        }

    }));
});