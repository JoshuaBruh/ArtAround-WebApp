export default function VistaIntermediaSala({
    ePrimaTappa, itemDestinazione, infoSalaDestinazione, museo,
    isSpeaking, playAudio, stopAudio, onConferma
}) {
    const titolo = itemDestinazione.titolo || (ePrimaTappa ? 'Opera 1' : 'Opera');
    const nomeSala = infoSalaDestinazione?.nome || itemDestinazione.id_sala || 'Sala Museo';

    const immagineDaMostrare = museo?.mappa_generale || museo?.immagine || '/media/placeholder.jpg';

    const intro = ePrimaTappa
        ? `Per iniziare la visita, recati verso la prima opera: ${titolo}. Sala: ${nomeSala}.`
        : `Per proseguire verso l'opera: ${titolo}, spostati nella seguente sala: ${nomeSala}.`;

    const dettagli = [
        infoSalaDestinazione?.collocazione && `Collocazione: ${infoSalaDestinazione.collocazione}`,
        itemDestinazione.posizione && `Posizione opera: ${itemDestinazione.posizione}`,
        infoSalaDestinazione?.nota_per_orientarsi && `Come arrivare: ${infoSalaDestinazione.nota_per_orientarsi}`
    ].filter(Boolean).join('. ');

    const testoIndicazioniAudio = `${intro} ${dettagli}`;

    return (
        <div className="container py-4 text-center" style={{ maxWidth: '680px' }}>
            <div className="hero-card p-4 shadow-sm rounded-4">
                <h2 className="h4 fw-bold text-museo-primario mb-2">
                    {ePrimaTappa ? "Raggiungi la prima Sala" : "Cambio di Sala"}
                </h2>

                <p className="text-dark mb-3">
                    {ePrimaTappa ? (
                        <>Per iniziare la visita, recati verso la prima opera (<strong>{titolo}</strong>):</>
                    ) : (
                        <>Per proseguire verso l'opera (<strong>{titolo}</strong>), spostati nella seguente sala:</>
                    )}
                </p>

                {immagineDaMostrare && (
                    <div className="card border-0 shadow-sm overflow-hidden mb-3 mx-auto rounded-3" style={{maxHeight: '400px' }}>
                        <img
                            src={immagineDaMostrare}
                            alt={nomeSala}
                            className="w-100 h-100 object-fit-cover"
                            style={{ objectPosition: 'center' }}
                            loading="eager"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                )}

                <div className="card bg-light border-0 p-3 text-start mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h3 className="h6 fw-bold text-dark mb-0">Sala: {nomeSala}</h3>
                        {infoSalaDestinazione?.collocazione && (
                            <span className="badge bg-secondary">{infoSalaDestinazione.collocazione}</span>
                        )}
                    </div>

                    {infoSalaDestinazione?.descrizione && (
                        <p className="small text-dark mb-2 border-bottom pb-2">{infoSalaDestinazione.descrizione}</p>
                    )}

                    {itemDestinazione.posizione && (
                        <p className="small text-secondary mb-1">
                            <strong>Posizione opera:</strong> {itemDestinazione.posizione}
                        </p>
                    )}

                    {infoSalaDestinazione?.nota_per_orientarsi && (
                        <p className="small text-muted mb-0">
                            <strong>Come arrivare:</strong> {infoSalaDestinazione.nota_per_orientarsi}
                        </p>
                    )}
                </div>

                <div className="mb-3">
                    {!isSpeaking ? (
                        <button type="button" className="btn btn-outline-dark btn-sm w-100 py-2 fw-semibold" onClick={() => playAudio(testoIndicazioniAudio)}>
                            Ascolta Indicazioni di Percorso
                        </button>
                    ) : (
                        <button type="button" className="btn btn-outline-danger btn-sm w-100 py-2 fw-semibold" onClick={stopAudio}>
                            Interrompi Audio
                        </button>
                    )}
                </div>

                <button type="button" className="btn btn-museo-movimento btn-lg w-100 py-3 shadow-sm" onClick={onConferma}>
                    Sono arrivato, prosegui &rarr;
                </button>
            </div>
        </div>
    );
}