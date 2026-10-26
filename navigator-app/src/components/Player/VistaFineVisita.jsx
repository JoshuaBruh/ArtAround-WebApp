export default function VistaFineVisita({ visita, onExit }) {
    return (
        <div className="container py-5 text-center" style={{ maxWidth: '650px' }}>
            <div className="hero-card p-4 p-md-5 shadow-sm rounded-4">
                <span className="badge bg-success text-white mb-2 fs-6 px-3 py-2">
                    Visita Completata
                </span>
                <h2 className="h3 fw-bold text-museo-primario my-3">
                    Hai completato la visita: "{visita?.titolo}"
                </h2>
                <p className="text-secondary mb-4">
                    Speriamo che il percorso guidato sia stato di tuo gradimento. Puoi ora ritornare alla lista delle tue visite o al menù principale del museo.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                    <button type="button" className="btn btn-outline-secondary py-2 px-4 fw-semibold" onClick={() => onExit && onExit('listaVisite')}>
                        Torna alle Mie Visite
                    </button>
                    <button type="button" className="btn btn-museo-movimento py-2 px-4 fw-semibold" onClick={() => onExit && onExit('hero')}>
                        Torna al Menù Principale
                    </button>
                </div>
            </div>
        </div>
    );
}