import { useState, useEffect } from 'react';
import { getVisiteAdottate, getVisiteAutore, getVisita } from '../api';
import { CONFIG } from '../config';

export default function VisiteAdottate({ utenteId, ruolo, museo, onSelectVisita }) {
    const [visite, setVisite] = useState([]);
    const [caricamento, setCaricamento] = useState(true);
    const [errore, setErrore] = useState('');

    // Filtri e Paginazione
    const [ricerca, setRicerca] = useState('');
    const [ordinamento, setOrdinamento] = useState('titolo_asc');
    const [pagina, setPagina] = useState(1);
    const perPagina = 6;

    // Modale Dettaglio
    const [visitaInDettaglio, setVisitaInDettaglio] = useState(null);
    const [caricamentoDettaglio, setCaricamentoDettaglio] = useState(false);


    const ruoloEffettivo = ruolo || (() => {
        try {
            const u = JSON.parse(localStorage.getItem('artaround_utente') || '{}');
            return u.ruolo || 'visitatore';
        } catch {
            return 'visitatore';
        }
    })();

    // 1. Caricamento visite adottate
    useEffect(() => {
        if (!utenteId) {
            setCaricamento(false);
            return;
        }

        setCaricamento(true);
        setErrore('');

        const richiesta = ruoloEffettivo === 'autore'
            ? getVisiteAutore(utenteId, museo?.id_museo)
            : getVisiteAdottate(utenteId);

        richiesta
            .then((data) => {
                const tutte = Array.isArray(data) ? data : [];
                setVisite(tutte.filter(v => v.id_museo === CONFIG.id_museo));
            })
            .catch((err) => {
                console.error("Errore recupero visite:", err);
                setErrore("Impossibile caricare le tue visite. Riprova più tardi.");
            })
            .finally(() => setCaricamento(false));
    }, [utenteId, ruoloEffettivo, museo]);

    // Reset della pagina sui filtri
    useEffect(() => {
        setPagina(1);
    }, [ricerca, ordinamento, ruoloEffettivo]);

    // 2. Apri modale e carica i dettagli arricchiti con getVisita()
    const handleApriDettaglio = async (visita) => {
        const id = visita.id_visita || visita._id;
        setCaricamentoDettaglio(true);
        try {
            //getVisita arricchisce tutte le tappe con gli oggetti item/opere completi
            const visitaCompleta = await getVisita(id);
            setVisitaInDettaglio(visitaCompleta);
        } catch (e) {
            console.error("Impossibile recuperare il dettaglio arricchito:", e);
            setVisitaInDettaglio(visita); // Fallback se la chiamata fallisce
        } finally {
            setCaricamentoDettaglio(false);
        }
    };

    // 3. Fallback intelligente per l'immagine di copertina
    const getImmagineCopertina = (visita) => {
        if (visita?.immagine_copertina && typeof visita.immagine_copertina === 'string' && visita.immagine_copertina.trim() !== '') {
            return visita.immagine_copertina;
        }

        // Se non c'è la copertina, controlla la prima tappa
        if (visita?.tappe && visita.tappe.length > 0) {
            const t0 = visita.tappe[0];
            const img = t0?.item?.immagine ||
                t0?.opera?.immagine ||
                t0?.immagine ||
                (typeof t0?.id_oggetto === 'object' ? t0.id_oggetto?.immagine : null);

            if (img && typeof img === 'string' && img.trim() !== '') return img;
        }

        return '/media/placeholder.jpg';
    };

    // Filtraggio e Ordinamento
    const visiteFiltrate = visite.filter((v) => {
        if (!ricerca.trim()) return true;
        const q = ricerca.toLowerCase().trim();
        return (
            (v.titolo && v.titolo.toLowerCase().includes(q)) ||
            (v.descrizione && v.descrizione.toLowerCase().includes(q)) ||
            (v.id_visita && String(v.id_visita).toLowerCase().includes(q))
        );
    }).sort((a, b) => {
        if (ordinamento === 'titolo_asc') return (a.titolo || '').localeCompare(b.titolo || '');
        if (ordinamento === 'pubblicazione_desc') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (ordinamento === 'durata_asc') return (a.durata_stimata_minuti || 0) - (b.durata_stimata_minuti || 0);
        return 0;
    });

    const pagineTotali = Math.max(1, Math.ceil(visiteFiltrate.length / perPagina));
    const visitePaginate = visiteFiltrate.slice((pagina - 1) * perPagina, pagina * perPagina);

    return (
        <div className="container py-4">
            {/* INTESTAZIONE */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h2 className="h3 fw-bold text-museo-primario mb-1">
                        {ruoloEffettivo === 'autore' ? 'Le Mie Visite Create' : 'Le Mie Visite Adottate'}
                    </h2>
                    <p className="text-muted small mb-0">
                        {ruoloEffettivo === 'autore'
                            ? 'Le visite che hai creato, pubblicate e in bozza.'
                            : 'Sfoglia le visite salvate nel tuo profilo e avvia la guida interattiva.'}
                    </p>
                </div>
            </div>

            {/* BARRA DI RICERCA E FILTRI */}
            <div className="hero-card p-3 p-md-4 mb-4 shadow-sm">
                <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-6">
                        <label htmlFor="search-visite" className="form-label fw-bold small text-museo-primario mb-1">
                            Ricerca per titolo o descrizione
                        </label>
                        <div className="input-group">
                            <input
                                id="search-visite"
                                type="text"
                                className="form-control"
                                placeholder="Cerca tra le tue visite..."
                                value={ricerca}
                                onChange={(e) => setRicerca(e.target.value)}
                            />
                            {ricerca && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setRicerca('')}
                                    aria-label="Cancella ricerca"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-12 col-md-6">
                        <label htmlFor="sort-visite" className="form-label fw-bold small text-museo-primario mb-1">
                            Ordina per
                        </label>
                        <select
                            id="sort-visite"
                            className="form-select"
                            value={ordinamento}
                            onChange={(e) => setOrdinamento(e.target.value)}
                        >
                            <option value="titolo_asc">Titolo (A-Z)</option>
                            <option value="pubblicazione_desc">Più recenti</option>
                            <option value="durata_asc">Durata (più brevi)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* STATI: CARICAMENTO / ERRORE / VUOTO */}
            {caricamento && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Caricamento in corso...</span>
                    </div>
                    <p className="text-muted mt-2">Caricamento delle tue visite in corso...</p>
                </div>
            )}

            {errore && (
                <div className="alert alert-danger text-center" role="alert">
                    {errore}
                </div>
            )}

            {!caricamento && !errore && visiteFiltrate.length === 0 && (
                <div className="alert-museo-empty p-4 text-center my-4 shadow-sm" role="status">
                    <h3 className="h6 fw-bold text-museo-primario mb-1">Nessuna visita trovata</h3>
                    <p className="small text-secondary mb-0">
                        Non ci sono visite corrispondenti ai criteri di ricerca selezionati tra quelle adottate.
                    </p>
                </div>
            )}

            {/* GRIGLIA CARD VISITE */}
            {!caricamento && !errore && visiteFiltrate.length > 0 && (
                <>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        {visitePaginate.map((visita) => (
                            <div className="col" key={visita.id_visita || visita._id}>
                                <div className="card-visita h-100 shadow-sm overflow-hidden d-flex flex-column p-3">
                                    <div className="position-relative bg-light rounded-3 overflow-hidden mb-3" style={{ height: '320px' }}>
                                        <img
                                            src={getImmagineCopertina(visita)}
                                            alt={`Copertina della visita ${visita.titolo}`}
                                            className="w-100 h-100 object-fit-cover"
                                            style={{ objectPosition: 'top' }}
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.src = '/media/placeholder.jpg'; }}
                                        />
                                        {ruoloEffettivo === 'autore' && (
                                            <span className={`position-absolute top-0 start-0 badge m-2 ${visita.pubblicata ? 'bg-success' : 'bg-warning'}`}>
                                                {visita.pubblicata ? 'Pubblicata' : 'Bozza'}
                                            </span>
                                        )}
                                        <span className="position-absolute top-0 end-0 badge bg-dark opacity-75 m-2">
                                            {visita.tappe ? visita.tappe.length : 0} Tappe
                                        </span>
                                    </div>

                                    <div className="d-flex flex-column flex-grow-1">
                                        <h3 className="h5 fw-bold text-dark mb-1">{visita.titolo}</h3>
                                        <p className="text-secondary small mb-3 flex-grow-1">
                                            {visita.descrizione || 'Nessuna descrizione fornita.'}
                                        </p>

                                        <div className="d-flex justify-content-between align-items-center mb-3 pt-2 border-top small text-muted">
                                            <span>⏱ {visita.durata_stimata_minuti || 30} min</span>
                                            <span> {visita.id_autore || 'Autore'}</span>
                                        </div>

                                        <div className="d-flex gap-2 mt-auto">
                                            <button
                                                type="button"
                                                className="btn btn-museo-info flex-grow-1"
                                                onClick={() => handleApriDettaglio(visita)}
                                                disabled={caricamentoDettaglio}
                                                aria-label={`Dettagli della visita ${visita.titolo}`}
                                            >
                                                Info
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-museo-movimento flex-grow-1"
                                                onClick={() => onSelectVisita(visita.id_visita || visita._id)}
                                                aria-label={`Avvia la guida per la visita ${visita.titolo}`}
                                            >
                                                Avvia Guida →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAGINAZIONE */}
                    {pagineTotali > 1 && (
                        <nav aria-label="Navigazione pagine visite" className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                            <span className="small text-muted">
                                Pagina <strong>{pagina}</strong> di <strong>{pagineTotali}</strong>
                            </span>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${pagina === 1 ? 'disabled' : ''}`}>
                                    <button
                                        type="button"
                                        className="page-link"
                                        onClick={() => setPagina((p) => Math.max(1, p - 1))}
                                        disabled={pagina === 1}
                                    >
                                        &laquo; Indietro
                                    </button>
                                </li>
                                <li className={`page-item ${pagina === pagineTotali ? 'disabled' : ''}`}>
                                    <button
                                        type="button"
                                        className="page-link"
                                        onClick={() => setPagina((p) => Math.min(pagineTotali, p + 1))}
                                        disabled={pagina === pagineTotali}
                                    >
                                        Avanti &raquo;
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}

            {/* MODALE DETTAGLIO ITINERARIO (Layout Card Piccole identical alla sorgente Alpine) */}
            {visitaInDettaglio && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-visita-titolo"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                    onClick={() => setVisitaInDettaglio(null)}
                >
                    <div
                        className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-light">
                                <div>
                                    <h3 className="h5 modal-title fw-bold text-museo-primario" id="modal-visita-titolo">
                                        {visitaInDettaglio.titolo}
                                    </h3>
                                    <small className="text-muted">
                                        ID: {visitaInDettaglio.id_visita || visitaInDettaglio._id} | Durata: {visitaInDettaglio.durata_stimata_minuti || 30} min
                                    </small>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setVisitaInDettaglio(null)}
                                    aria-label="Chiudi finestra dettagli"
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                <div className="mb-4">
                                    <h4 className="h6 fw-bold text-dark border-bottom pb-2">Descrizione</h4>
                                    <p className="text-secondary small">
                                        {visitaInDettaglio.descrizione || 'Nessuna descrizione fornita per questa visita.'}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="h6 fw-bold text-dark border-bottom pb-2 d-flex justify-content-between align-items-center">
                                        <span>Itinerario Tappe</span>
                                        <span className="badge bg-secondary">
                                            {visitaInDettaglio.tappe?.length || 0} opere
                                        </span>
                                    </h4>

                                    {visitaInDettaglio.tappe && visitaInDettaglio.tappe.length > 0 ? (
                                        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-3 pt-2">
                                            {visitaInDettaglio.tappe.map((tappa, index) => {
                                                const itemObj = tappa?.item || tappa?.opera || (typeof tappa?.id_oggetto === 'object' ? tappa.id_oggetto : {}) || {};
                                                const immagineOpera = itemObj?.immagine || tappa?.immagine || '/media/placeholder.jpg';
                                                const titoloOpera = itemObj?.titolo || tappa?.titolo || 'Senza Titolo';
                                                const artistaOpera = itemObj?.nome_artista || itemObj?.id_artista || tappa?.id_artista || '';
                                                const isOpzionale = Boolean(tappa?.opzionale);

                                                return (
                                                    <div className="col" key={itemObj?._id || tappa?.id_oggetto || index}>
                                                        <div className="card h-100 border-0 shadow-sm bg-light position-relative overflow-hidden">
                                                            {/* Badge Numero Tappa */}
                                                            <span
                                                                className="position-absolute top-0 start-0 badge bg-dark opacity-75 m-1 rounded-circle"
                                                                style={{ zIndex: 2 }}
                                                            >
                                                                {index + 1}
                                                            </span>

                                                            {/* Badge Opzionale */}
                                                            {isOpzionale && (
                                                                <span
                                                                    className="position-absolute top-0 end-0 badge bg-warning text-dark m-1 rounded-pill shadow-sm"
                                                                    style={{ zIndex: 2 }}
                                                                >
                                                                    Opzionale
                                                                </span>
                                                            )}

                                                            {/* Immagine Opera */}
                                                            <div style={{ height: '150px' }} className="bg-secondary-subtle">
                                                                <img
                                                                    src={immagineOpera}
                                                                    className="w-100 h-100 object-fit-cover"
                                                                    style={{ objectPosition: 'top' }}
                                                                    alt={titoloOpera}
                                                                    loading="lazy"
                                                                    onError={(e) => { e.target.onerror = null; e.target.src = '/media/placeholder.jpg'; }}
                                                                />
                                                            </div>

                                                            {/* Titolo e Artista Opera */}
                                                            <div className="card-body p-2 text-center">
                                                                <div className="fw-bold small text-dark mb-1" title={titoloOpera}
                                                                    style={{
                                                                        lineHeight: '1.3em',
                                                                        maxHeight: '2.6em',
                                                                        minHeight: '2.6em',
                                                                        overflow: 'hidden'
                                                                    }}>
                                                                    {titoloOpera}
                                                                </div>
                                                                {artistaOpera && (
                                                                    <small className="text-muted d-block text-truncate">
                                                                        {artistaOpera}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="alert alert-warning py-2 mt-2 small text-center">
                                            Nessuna informazione o opera trovata per le tappe di questa visita.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer bg-light">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setVisitaInDettaglio(null)}
                                >
                                    Chiudi
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-museo-movimento"
                                    onClick={() => {
                                        const id = visitaInDettaglio.id_visita || visitaInDettaglio._id;
                                        setVisitaInDettaglio(null);
                                        onSelectVisita(id);
                                    }}
                                >
                                    Avvia Guida
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}