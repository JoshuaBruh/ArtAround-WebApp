export default function Header({ museo, utenteId, onLogout, onLogin, onGoHome }) {
    return (
        <header className="header-museo sticky-top shadow-sm py-2 px-2 px-sm-3">
            <div className="container-fluid container-md d-flex justify-content-between align-items-center">
                {/* Brand e Nome Museo dinamico */}
                <button
                    type="button"
                    className="btn btn-link text-decoration-none p-0 border-0 text-start d-flex flex-column align-items-start cursor-pointer me-2 overflow-hidden"
                    onClick={onGoHome}
                    aria-label={`ArtAround - Torna alla Home del ${museo?.nome || 'Museo'}`}
                >
                    <span className="fs-5 fw-bold text-white lh-1">ArtAround</span>

                    {museo?.nome && (
                        <span
                            className="badge bg-museo-terziario text-dark mt-1 text-truncate"
                            style={{ maxWidth: '200px', fontSize: '0.75rem' }}
                            title={museo.nome}
                        >
                            {museo.nome}
                        </span>
                    )}
                </button>

                {/* Navigazione principale e Stato Utente */}
                <nav aria-label="Navigazione principale" className="flex-shrink-0">
                    <ul className="nav align-items-center gap-1 gap-sm-2">

                        {utenteId ? (
                            <>
                                <li className="nav-item">

                                    <span
                                        className="badge bg-light text-dark px-2 py-1 text-truncate d-inline-block align-middle"
                                        style={{ maxWidth: '90px' }}
                                        title={utenteId}
                                    >
                                        {utenteId}
                                    </span>
                                </li>
                                <li className="nav-item">
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm px-2 py-1"
                                        onClick={onLogout}
                                        aria-label="Disconnettiti dall'applicazione"
                                    >
                                        Esci
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="btn btn-outline-light btn-sm px-2 py-1"
                                    onClick={onLogin}
                                    aria-label="Accedi"
                                >
                                    Accedi

                                </button>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
}