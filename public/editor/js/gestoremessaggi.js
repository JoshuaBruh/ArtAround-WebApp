document.addEventListener('alpine:init', () => {

    Alpine.data('gestoreMessaggi', () => ({
        toasts: [],
        prossimoId: 1,

        mostraToast(testo, tipo = 'info') {
            const id = this.prossimoId++;
            this.toasts.push({ id, testo, tipo });
            setTimeout(() => this.rimuoviToast(id), 4000);
        },

        rimuoviToast(id) {
            this.toasts = this.toasts.filter(t => t.id !== id);
        }
    }));

    Alpine.data('gestoreConferma', () => ({
        mostraConferma: false,
        messaggioConferma: '',
        azionePendente: null,

        apriConferma(messaggio, azione) {
            this.messaggioConferma = messaggio;
            this.azionePendente = azione;
            this.mostraConferma = true;
        },

        conferma() {
            this.mostraConferma = false;
            if (typeof this.azionePendente === 'function') {
                this.azionePendente();
            }
            this.azionePendente = null;
        }
    }));

});

// -----------------------------------------------------------------------------
// Helper globali 
// -----------------------------------------------------------------------------

function mostraMessaggio(testo, tipo = 'info') {
    window.dispatchEvent(new CustomEvent('mostra-messaggio', { detail: { testo, tipo } }));
}

function confermaAzione(messaggio, azioneSeConfermato) {
    window.dispatchEvent(new CustomEvent('richiedi-conferma', {
        detail: { messaggio, onConferma: azioneSeConfermato }
    }));
}