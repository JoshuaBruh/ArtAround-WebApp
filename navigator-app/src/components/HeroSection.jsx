export default function HeroSection({ museo, onIniziaVisita }) {
    const haInfo = museo?.info_generali || museo?.costo || museo?.indicazioni_utili?.entrata || museo?.indirizzi?.via;
    return (
        <div className="container py-4">
            <div className="hero-museo rounded-4 shadow-sm text-center p-4 p-md-5">
                <h2 className="display-6 fw-bold mb-2 text-museo-primario">
                    Benvenuto al <span className="text-museo-terziario">{museo?.nome || '...'}</span>
                </h2>

                <p className="lead text-muted mb-5">Scegli come procedere:</p>

                <div className="row g-4 justify-content-center">
                    {/* Card 1: Inizia Visita (Bottone nativo per azioni) */}
                    <div className="col-md-5">
                        <button
                            type="button"
                            className="hero-card w-100 h-100 p-4 text-start d-flex flex-column justify-content-between cursor-pointer"
                            onClick={onIniziaVisita}
                            aria-label="Inizia Visita: Seleziona le tue visite e avvia la guida audio interattiva"
                        >
                            <div>
                                <span className="h4 fw-bold text-museo-primario mb-3 d-block">Inizia Visita</span>
                                <span className="text-secondary mb-4 d-block">
                                    Seleziona le tue visite e avvia la guida audio interattiva.
                                </span>
                            </div>
                            <span className="btn btn-museo-movimento w-100 text-center">
                                Avvia Guida →
                            </span>
                        </button>
                    </div>

                    {/* Card 2: Editor & Marketplace (Link nativo per navigazione) */}
                    <div className="col-md-5">
                        <a
                            href="/editor/index.html#dettaglio_museo"
                            className="hero-card w-100 h-100 p-4 text-start d-flex flex-column justify-content-between text-decoration-none cursor-pointer d-block"
                            aria-label="Vai all'Editor e Marketplace: Crea o modifica visite guidate e gestisci la libreria"
                        >
                            <div>
                                <h3 className="h4 fw-bold text-museo-primario mb-3">Editor &amp; Marketplace</h3>
                                <p className="text-secondary mb-4">
                                    Crea o modifica visite guidate e gestisci la libreria.
                                </p>
                            </div>
                            <span className="btn btn-museo-info w-100 text-center">
                                Vai all'Editor
                            </span>
                        </a>
                    </div>

                    {haInfo && (
                        <div className="row g-4 justify-content-center mt-4">
                            <div className="col-md-10">
                                <div className="hero-card w-100 p-4 text-start">
                                    <h3 className="h4 fw-bold text-museo-primario mb-3">Informazioni sul Museo</h3>
                                    {museo?.info_generali && (
                                        <p className="text-secondary mb-3">{museo.info_generali}</p>
                                    )}
                                    <div className="d-flex flex-wrap gap-2">
                                        {museo?.indirizzi?.via && (
                                            <span
                                                className="rounded-pill px-3 py-2 small fw-semibold"
                                                style={{ backgroundColor: 'var(--museo-primario)', color: '#fff' }}
                                            >
                                                Entrata: {museo.indirizzi.via}
                                                {museo.indirizzi.cap ? `, ${museo.indirizzi.cap}` : ''}
                                                {museo.indirizzi.provincia ? `, ${museo.indirizzi.provincia}` : ''}
                                            </span>
                                        )}
                                        {museo?.costo && (
                                            <span
                                                className="rounded-pill px-3 py-2 small fw-semibold"
                                                style={{ backgroundColor: 'var(--museo-primario)', color: '#fff' }}
                                            >
                                                Ingresso: {museo.costo}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
