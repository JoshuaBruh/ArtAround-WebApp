// ==========================================
// AGGIUNGI/MODIFICA CONTENUTO
// ==========================================
document.addEventListener('alpine:init', () => {

    const creaDescrizioniVuote = () => ({
        infantile: { '3s': { id_testo: 'inf_3s', testo: '' }, '15s': { id_testo: 'inf_15s', testo: '' }, '1m': { id_testo: 'inf_1m', testo: '' }, '3m': { id_testo: 'inf_3m', testo: '' } },
        semplice: { '3s': { id_testo: 'smp_3s', testo: '' }, '15s': { id_testo: 'smp_15s', testo: '' }, '1m': { id_testo: 'smp_1m', testo: '' }, '3m': { id_testo: 'smp_3m', testo: '' } },
        medio: { '3s': { id_testo: 'med_3s', testo: '' }, '15s': { id_testo: 'med_15s', testo: '' }, '1m': { id_testo: 'med_1m', testo: '' }, '3m': { id_testo: 'med_3m', testo: '' } },
        avanzato: { '3s': { id_testo: 'avz_3s', testo: '' }, '15s': { id_testo: 'avz_15s', testo: '' }, '1m': { id_testo: 'avz_1m', testo: '' }, '3m': { id_testo: 'avz_3m', testo: '' } }
    });

    const unisciDescrizioni = (descrizioniDB) => {
        const base = creaDescrizioniVuote();
        if (!descrizioniDB) return base;

        Object.keys(base).forEach(livello => {
            if (descrizioniDB[livello]) {
                Object.keys(base[livello]).forEach(durata => {
                    if (descrizioniDB[livello][durata]) {
                        base[livello][durata] = {
                            id_testo: descrizioniDB[livello][durata].id_testo || base[livello][durata].id_testo,
                            testo: descrizioniDB[livello][durata].testo || ''
                        };
                    }
                });
            }
        });
        return base;
    };

    // 1. GESTORE SUB-FORM (riutilizzabile per Artista / Movimento / Tecnica)
    Alpine.data('gestoreSubForm', () => ({
        mostraSubForm: false,
        eModifica: false,
        targetField: null,
        subFormData: {
            id_oggetto: '',
            tipo: 'artista',
            titolo: '',
            immagine: '',
            licenza: '',
            descrizioni: creaDescrizioniVuote()
        },

        // Apri il subform in modalità creazione o modifica
        async apriSubForm(tipo, elemento = null, targetField = null) {
            this.targetField = targetField || null;

            if (elemento && (elemento.id_oggetto || elemento._id)) {
                const idCercato = elemento.id_oggetto || elemento._id;
                this.eModifica = true;
                try {
                    const res = await fetch(`/api/items/${idCercato}`);
                    if (!res.ok) throw new Error('Errore nel recupero dell\'item');
                    const itemCompleto = await res.json();
                    this.subFormData = itemCompleto;
                    this.subFormData.descrizioni = unisciDescrizioni(itemCompleto.descrizioni);
                } catch (e) {
                    console.error('Impossibile caricare il dettaglio dell\'item:', e);
                    this.subFormData = JSON.parse(JSON.stringify(elemento));
                    this.subFormData.descrizioni = unisciDescrizioni(this.subFormData.descrizioni);
                    Alpine.store('app').NuovaVista('libreria');
                    return;
                }
            } else {
                this.subFormData = {
                    id_oggetto: '',
                    tipo: tipo,
                    titolo: '',
                    immagine: '',
                    licenza: '',
                    descrizioni: creaDescrizioniVuote()
                };
                this.eModifica = false;
            }
            this.mostraSubForm = true;
        },


        async salvaSubForm(targetFieldInOperaForm = null) {
            // 1. Validazione di sicurezza prima dell'invio
            if (!this.subFormData.id_oggetto.trim() || !this.subFormData.titolo.trim()) {
                mostraMessaggio("Compila sia l'ID Oggetto (QID) che il Nome/Titolo.", 'errore');
                return;
            }
            if (!this.eModifica) {
                this.subFormData.id_autore = Alpine.store('app').utente?.id_utente || '';
            }
            const target = targetFieldInOperaForm || this.targetField;
            const url = this.eModifica ? `/api/items/${this.subFormData.id_oggetto}` : '/api/items';

            try {
                const res = await fetch(url, {
                    method: this.eModifica ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.subFormData)
                });

                if (res.ok) {
                    // 2. Leggi IMMEDIATAMENTE il JSON restituito dal server
                    const salvato = await res.json().catch(() => null);
                    const idConfermato = salvato?.id_oggetto || salvato?._id || this.subFormData.id_oggetto;

                    // 3. Ricarica la lista degli elementi nello store
                    if (typeof Alpine.store('app').caricaEntita === 'function') {
                        await Alpine.store('app').caricaEntita();
                    }
                    if (typeof Alpine.store('app').caricaOpere === 'function') {
                        await Alpine.store('app').caricaOpere();
                    }

                    // 4.Aspetta il rendering del DOM (<option>) prima di impostare il valore
                    Alpine.nextTick(() => {
                        if (target && Alpine.store('app').operaFormData) {
                            Alpine.store('app').operaFormData[target] = idConfermato;
                        }
                    });

                    mostraMessaggio(`${this.eModifica ? 'Modifiche salvate' : 'Elemento creato'} con successo.`, 'successo');
                    window.dispatchEvent(new CustomEvent('ricarica-libreria'));
                    // 5. Chiudi la modale
                    this.mostraSubForm = false;
                } else {
                    const err = await res.json().catch(() => ({}));
                    mostraMessaggio(`Errore nel salvataggio: ${err.errore || err.message || res.statusText}`, 'errore');
                }
            } catch (e) {
                console.error('Errore salvaSubForm:', e);
                mostraMessaggio("Impossibile completare l'operazione.", 'errore');
            }
        },

        async eliminaOggettoSubForm() {
            const id = this.subFormData.id_oggetto;
            if (!id) return;

            confermaAzione(`Sei sicuro di voler eliminare "${this.subFormData.titolo || id}"?`, async () => {
                try {
                    const res = await fetch(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });

                    if (res.ok) {
                        // Aggiorna sia le entità generali che la lista opere nello store
                        await Alpine.store('app').caricaEntita();
                        await Alpine.store('app').caricaOpere();

                        // Svuota il campo di riferimento nel form dell'opera se corrisponde all'ID eliminato
                        if (this.targetField && Alpine.store('app').operaFormData) {
                            if (Alpine.store('app').operaFormData[this.targetField] === id) {
                                Alpine.store('app').operaFormData[this.targetField] = '';
                            }
                        }
                        mostraMessaggio('Elemento eliminato.', 'successo');
                        window.dispatchEvent(new CustomEvent('ricarica-libreria'));
                        this.mostraSubForm = false;
                    } else {
                        const err = await res.json().catch(() => ({}));
                        mostraMessaggio(`Errore nell'eliminazione: ${err.errore || err.message || res.statusText}`, 'errore');
                    }
                } catch (e) {
                    console.error('Errore eliminaOggettoSubForm:', e);
                    mostraMessaggio("Errore di connessione durante l'eliminazione.", 'errore');
                }
            });
        }
    }));

    // 2. GESTORE OPERA PRINCIPALE
    Alpine.data('gestoreOpera', () => ({
        eModifica: false,
        formData: {
            id_oggetto: '',
            tipo: 'opera',
            titolo: '',
            id_museo: '',
            id_sala: '',
            posizione: '',
            licenza: '',
            id_artista: '',
            id_movimento: '',
            id_tecnica: '',
            immagine: '',
            descrizioni: creaDescrizioniVuote()
        },

        async init() {
            const itemInModifica = Alpine.store('app').itemInModifica;
            if (itemInModifica) {
                await this.apriFormOpera(itemInModifica);
                Alpine.store('app').itemInModifica = null;
            } else {
                await this.apriFormOpera(null);
            }
        },

        async apriFormOpera(opera = null) {
            if (opera && opera.tipo && opera.tipo !== 'opera') {
                window.dispatchEvent(new CustomEvent('apri-subform', {
                    detail: {
                        tipo: opera.tipo,
                        elemento: opera,
                        targetField: null
                    }
                }));
                // Ripristina la vista su libreria per non mostrare il form opera vuoto sotto la modale
                Alpine.store('app').vista = 'libreria';
                return;
            }
            if (opera && opera.id_oggetto) {
                this.eModifica = true;
                try {
                    // Fetch del documento completo prima di azionare il form
                    const res = await fetch(`/api/items/${opera.id_oggetto}`);
                    if (!res.ok) throw new Error('Errore nel recupero dell\'opera');
                    const operaCompleta = await res.json();

                    this.formData = operaCompleta;
                    this.formData.descrizioni = unisciDescrizioni(operaCompleta.descrizioni);
                } catch (e) {
                    console.error('Impossibile caricare il dettaglio dell\'opera:', e);
                    mostraMessaggio("Impossibile aprire l'opera: dati non caricati. Riprova.", 'errore');
                    Alpine.store('app').NuovaVista('libreria');
                    return;
                }
            } else {
                this.formData = {
                    id_oggetto: '',
                    tipo: 'opera',
                    titolo: '',
                    id_museo: Alpine.store('app').museoSelezionato?.id_museo || '',
                    id_sala: '',
                    posizione: '',
                    licenza: '',
                    id_artista: '',
                    id_movimento: '',
                    id_tecnica: '',
                    immagine: '',
                    descrizioni: creaDescrizioniVuote()
                };
                this.eModifica = false;
            }
            Alpine.store('app').operaFormData = this.formData;
        },

        async salvaOpera() {
            this.formData.id_museo = Alpine.store('app').museoSelezionato?.id_museo || '';
            if (!this.eModifica) {
                this.formData.id_autore = Alpine.store('app').utente?.id_utente || '';
            }
            const url = this.eModifica ? `/api/items/${this.formData.id_oggetto}` : '/api/items';
            try {
                const res = await fetch(url, {
                    method: this.eModifica ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.formData)
                });

                if (res.ok) {
                    await Alpine.store('app').caricaOpere();
                    mostraMessaggio(`Opera ${this.eModifica ? 'aggiornata' : 'creata'} con successo.`, 'successo'); Alpine.store('app').NuovaVista('libreria');
                } else {
                    const err = await res.json().catch(() => ({}));
                    mostraMessaggio(`Errore nel salvataggio dell'opera: ${err.errore || err.message || res.statusText}`, 'errore');
                }
            } catch (e) {
                console.error('Errore salvaOpera:', e);
                mostraMessaggio("Errore di connessione durante il salvataggio dell'opera.", 'errore');
            }
        },

        eliminaOperaForm() {
            const id = this.formData.id_oggetto;
            if (!id) return;

            confermaAzione(`Sei sicuro di voler eliminare l'opera "${this.formData.titolo || id}"?`, async () => {
                try {
                    const res = await fetch(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });

                    if (res.ok) {
                        await Alpine.store('app').caricaOpere();
                        mostraMessaggio('Opera eliminata.', 'successo');
                        Alpine.store('app').NuovaVista('libreria');
                    } else {
                        const err = await res.json().catch(() => ({}));
                        mostraMessaggio(`Errore nell'eliminazione dell'opera: ${err.errore || err.message || res.statusText}`, 'errore');
                    }
                } catch (e) {
                    console.error('Errore eliminaOperaForm:', e);
                    mostraMessaggio("Errore di connessione durante l'eliminazione dell'opera.", 'errore');
                }
            });
        }
    }));
});
