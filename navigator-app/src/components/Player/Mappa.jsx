import { useState, useEffect } from 'react';

const getInfo = (valore, fallback) => {
    if (valore && typeof valore === 'string' && valore.trim() !== '') return valore;
    return fallback;
};

export function costruisciDettaglioMappa(chiave, { museo, infoSalaCorrente, posizioneOpera }) {
    const ind = museo?.indicazioni_utili || {};

    switch (chiave) {
        case 'piantina':
            return {
                titolo: "Piantina Generale del Museo",
                immagine: museo?.mappa_generale || "/media/placeholder.jpg",
                testo: `Piantina degli ambienti di ${museo?.nome || "Museo"}.\n` +
                    `Ti trovi nella sala: ${getInfo(infoSalaCorrente?.nome, "Non specificata")}.\n` +
                    `${getInfo(infoSalaCorrente?.collocazione, "")}\n` +
                    `Posizione dell'opera: ${getInfo(posizioneOpera, "Non specificata")}\n` +
                    `Consulta la numerazione delle sale per orientarti.`
            };

        case 'sala_corrente':
            return {
                titolo: "Sono nella sala giusta?",
                testo: `Sala corrente: ${getInfo(infoSalaCorrente?.nome, "Non specificata")}\nCollocazione: ${getInfo(infoSalaCorrente?.collocazione, "Informazione non presente")}\nPosizione opera: ${getInfo(posizioneOpera, "Non specificata")}\nNota per orientarsi: ${getInfo(infoSalaCorrente?.nota_per_orientarsi, "Nessuna nota presente")}`
            };

        case 'descrizione_sala':
            return {
                titolo: "Descrizione della Sala",
                testo: getInfo(infoSalaCorrente?.descrizione, "Nessuna descrizione disponibile per questa sala.")
            };

        case 'ostacoli':
            return {
                titolo: "Ostacoli e Accessibilità Sala",
                testo: getInfo(infoSalaCorrente?.ostacoli_accessibilita, "Non sono presenti ostacoli di accessibilità all'interno della sala.")
            };

        case 'uscite_emergenza':
            return {
                titolo: "Uscite di Emergenza",
                testo: getInfo(ind.uscite_emergenza, "Seguire la segnaletica verde per le uscite di sicurezza e di emergenza.")
            };

        case 'servizi':
            return {
                titolo: "Servizi del Museo",
                testo: `Bagni: ${getInfo(ind.bagni, "Non sono presenti bagni all'interno del museo.")}\nAscensori: ${getInfo(ind.ascensori, "Non sono presenti ascensori.")}\nScale: ${getInfo(ind.scale, "Non sono presenti scale lungo il percorso principale.")}\nBar / Ristoro: ${getInfo(ind.bar, "Non è presente un punto ristoro o bar interno.")}\nBookshop / Shop: ${getInfo(ind.shop, "Non è presente un bookshop o shop interno.")}`
            };

        case 'bagni':
            return {
                titolo: "Bagni",
                testo: getInfo(ind.bagni, "Non sono presenti bagni all'interno del museo.")
            };

        case 'bar':
            return {
                titolo: "Bar / Ristoro",
                testo: getInfo(ind.bar, "Non è presente un punto ristoro o bar interno.")
            };

        case 'shop':
            return {
                titolo: "Bookshop / Shop",
                testo: getInfo(ind.shop, "Non è presente un bookshop o shop interno.")
            };

        case 'ingressi_uscite':
            return {
                titolo: "Ingressi ed Uscite",
                testo: `Entrata principale: ${getInfo(ind.entrata, "Non specificata")}\nUscita principale: ${getInfo(ind.uscita, "Coincide con l'ingresso principale.")}`
            };

        default:
            return null;
    }
}
export default function Mappa({ museo, infoSalaCorrente, posizioneOpera, dettaglioIniziale, onClose }) {
    const [dettaglio, setDettaglio] = useState(dettaglioIniziale || null);

    useEffect(() => {
        if (dettaglioIniziale) {
            setDettaglio(dettaglioIniziale);
        }
    }, [dettaglioIniziale]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const ctx = { museo, infoSalaCorrente, posizioneOpera };

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titolo-mappa"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
        >
            <div
                className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content border-0 shadow">

                    <div className="modal-header bg-light">
                        <h5 className="modal-title fw-bold text-museo-primario" id="titolo-mappa">
                            Informazioni, Mappa e Orientamento
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Chiudi finestra"></button>
                    </div>

                    <div className="modal-body p-4">
                        {!dettaglio ? (
                            <div className="row g-3">
                                <div className="col-12">
                                    <button
                                        type="button"
                                        className="btn btn-museo-movimento w-100 text-start p-3 shadow-sm d-flex justify-content-between align-items-center"
                                        onClick={() => setDettaglio(costruisciDettaglioMappa('piantina', ctx))}
                                    >
                                        <span className="fw-bold">Piantina Generale del Museo</span>
                                        <span>Visualizza &rarr;</span>
                                    </button>
                                </div>

                                <div className="col-12 col-md-6">
                                    <div className="card h-100 border p-3 bg-light">
                                        <h6 className="fw-bold text-museo-primario mb-2">Orientamento in Sala</h6>
                                        <div className="d-grid gap-2">
                                            <button type="button" className="btn btn-outline-dark text-start btn-sm py-2"
                                                onClick={() => setDettaglio(costruisciDettaglioMappa('sala_corrente', ctx))}>
                                                Verifica Sala e Posizione Opera
                                            </button>
                                            <button type="button" className="btn btn-outline-dark text-start btn-sm py-2"
                                                onClick={() => setDettaglio(costruisciDettaglioMappa('descrizione_sala', ctx))}>
                                                Descrizione della Sala
                                            </button>
                                            <button type="button" className="btn btn-outline-dark text-start btn-sm py-2"
                                                onClick={() => setDettaglio(costruisciDettaglioMappa('ostacoli', ctx))}>
                                                Ostacoli di Accessibilità Sala
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 col-md-6">
                                    <div className="card h-100 border p-3 bg-light">
                                        <h6 className="fw-bold text-museo-primario mb-2">Servizi e Sicurezza</h6>
                                        <div className="d-grid gap-2">
                                            <button type="button" className="btn btn-outline-dark text-start btn-sm py-2"
                                                onClick={() => setDettaglio(costruisciDettaglioMappa('uscite_emergenza', ctx))}>
                                                Uscite di Emergenza
                                            </button>
                                            <button type="button" className="btn btn-outline-dark text-start btn-sm py-2"
                                                onClick={() => setDettaglio(costruisciDettaglioMappa('servizi', ctx))}>
                                                Bagni, Ascensori, Bar e Shop
                                            </button>
                                            <button type="button" className="btn btn-outline-dark text-start btn-sm py-2"
                                                onClick={() => setDettaglio(costruisciDettaglioMappa('ingressi_uscite', ctx))}>
                                                Entrata ed Uscita Museo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h6 className="fw-bold text-museo-primario border-bottom pb-2 mb-3">{dettaglio.titolo}</h6>

                                {dettaglio.immagine && (
                                    <div className="mb-3 text-center bg-dark rounded p-2">
                                        <img
                                            src={dettaglio.immagine}
                                            alt={dettaglio.titolo}
                                            className="img-fluid rounded"
                                            style={{ maxHeight: "420px", objectFit: "contain" }}
                                            loading="lazy"
                                            onError={(e) => { e.target.style.display = "none"; }}
                                        />
                                    </div>
                                )}

                                {dettaglio.testo && (
                                    <div className="alert alert-light border p-3 text-dark" style={{ whiteSpace: "pre-line" }}>
                                        {dettaglio.testo}
                                    </div>
                                )}

                                <button type="button" className="btn btn-secondary w-100 mt-3" onClick={() => setDettaglio(null)}>
                                    &larr; Torna alle Opzioni
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
