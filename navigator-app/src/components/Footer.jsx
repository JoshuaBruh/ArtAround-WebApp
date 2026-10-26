export default function Footer({ museo }) {
    const social = museo?.social;

    return (
        <footer className="footer-museo py-4 mt-auto">
            <div className="container">
                <div className="row g-4 align-items-center">
                    {/* Colonna 1: Info Museo e Descrizione Social Aspecifica/Personalizzata */}
                    <div className="col-md-7 text-center text-md-start">
                        <h5 className="fw-bold mb-1 text-museo-terziario">
                            ArtAround — {museo?.nome || 'Navigator'}
                        </h5>
                        <p className="small mb-0 opacity-90">
                            {social?.descrizione || "Ecco i nostri canali social ufficiali per rimanere sempre aggiornati su mostre, eventi e attività."}
                        </p>
                    </div>

                    {/* Colonna 2: Link Social Dinamici (mostrati solo se definiti nel museo) */}
                    <div className="col-md-5 text-center text-md-end">
                        <div className="d-flex justify-content-center justify-content-md-end gap-3 flex-wrap mb-2">
                            {social?.facebook && (
                                <a
                                    href={social.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-reset text-decoration-none fw-semibold"
                                    aria-label={`Pagina Facebook di ${museo?.nome || 'Museo'} (apre una nuova finestra)`}
                                >
                                    Facebook
                                </a>
                            )}

                            {social?.instagram && (
                                <a
                                    href={social.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-reset text-decoration-none fw-semibold"
                                    aria-label={`Profilo Instagram di ${museo?.nome || 'Museo'} (apre una nuova finestra)`}
                                >
                                    Instagram
                                </a>
                            )}

                            {social?.twitter && (
                                <a
                                    href={social.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-reset text-decoration-none fw-semibold"
                                    aria-label={`Profilo Twitter / X di ${museo?.nome || 'Museo'} (apre una nuova finestra)`}
                                >
                                    Twitter / X
                                </a>
                            )}

                            {social?.youtube && (
                                <a
                                    href={social.youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-reset text-decoration-none fw-semibold"
                                    aria-label={`Canale YouTube di ${museo?.nome || 'Museo'} (apre una nuova finestra)`}
                                >
                                    YouTube
                                </a>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </footer>
    );
}