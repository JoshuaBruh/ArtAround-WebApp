export default function VistaOperaOpzionale({ itemDestinazione, isUltimoTarget, onScelta }) {
    return (
        <div className="container py-4 text-center" style={{ maxWidth: '600px' }}>
            <div className="hero-card p-4 shadow-sm rounded-4">
                <span className="badge bg-warning text-dark mb-2">Tappa Opzionale</span>
                <h2 className="h4 fw-bold text-museo-primario mb-3">Vuoi visitare quest'opera opzionale?</h2>

                <div className="card border-0 shadow-sm overflow-hidden mb-3 mx-auto" style={{ maxWidth: '380px', height: '280px' }}>
                    <img
                        src={itemDestinazione.immagine || '/media/placeholder.jpg'}
                        alt={itemDestinazione.titolo || 'Opera opzionale'}
                        className="w-100 h-100 object-fit-cover"
                        style={{ objectPosition: 'top' }}
                        onError={(e) => { e.target.src = '/media/placeholder.jpg'; }}
                    />
                </div>

                <h3 className="h5 fw-bold text-dark mb-2">{itemDestinazione.titolo || 'Opera Opzionale'}</h3>

                <div className="d-flex gap-3 mt-4">
                    <button
                        type="button"
                        className={`btn ${isUltimoTarget ? 'btn-museo-info' : 'btn-outline-secondary'} flex-grow-1 py-2 fw-semibold`}
                        onClick={() => onScelta(false)}
                    >
                        {isUltimoTarget ? 'Termina Visita' : 'No, salta tappa'}
                    </button>
                    <button type="button" className="btn btn-museo-movimento flex-grow-1 py-2" onClick={() => onScelta(true)}>
                        Sì, visita opera
                    </button>
                </div>
            </div>
        </div>
    );
}