export default function MicrofonoButton({ isSupported, caricamentoVoce, isListening, onStart, onStop }) {
    if (!isSupported) {
        return (
            <button type="button" className="btn btn-secondary btn-sm" disabled title="Il tuo browser non supporta la voce">
                Mic non supportato
            </button>
        );
    }
 
    if (caricamentoVoce) {
        return (
            <button type="button" className="btn btn-warning btn-sm" disabled>
                Elaborazione...
            </button>
        );
    }
 
    return (
        <button
            type="button"
            className={`btn btn-sm ${isListening ? 'btn-danger animate-pulse' : 'btn-outline-primary'}`}
            onClick={isListening ? onStop : onStart}
            title={isListening ? "Premi per fermare l'ascolto" : "Parla al dispositivo"}
        >
            {isListening ? " In ascolto..." : " Parla"}
        </button>
    );
}
