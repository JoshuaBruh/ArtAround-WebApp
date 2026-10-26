import MicrofonoButton from './MicrofonoButton';
import Mappa from './Mappa';

export default function VistaCorrelato({
    tipo, data, testoCorrelato,
    isSpeaking, playAudio, stopAudio,
    micProps, errore,
    tonoCorrelato, setTonoCorrelato, durataCorrelato, setDurataCorrelato,
    indiceTappa, onTornaAllaVisita,
    mostraHelp, dettaglioHelpIniziale, onApriHelp, onChiudiHelp,
    museo, infoSalaCorrente, posizioneOpera
}) {
    const descrCorrelato = data?.descrizioni;
    const haDurataCorrelato = (d) => Boolean(descrCorrelato?.[tonoCorrelato]?.[d]?.testo);
    const haTonoCorrelato = (t) => Boolean(descrCorrelato?.[t] && Object.keys(descrCorrelato[t]).length > 0);

    return (
        <div className="container py-4" style={{ maxWidth: '850px' }}>
            <div className="hero-card p-4 shadow-sm rounded-4">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <span className="badge bg-museo-terziario text-dark">Scheda {tipo}</span>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onApriHelp}>
                        Aiuto / Sala
                    </button>
                </div>

                <div className="row g-4 mb-4">
                    {data.immagine && (
                        <div className="col-12 col-md-5">
                            <div style={{ height: '400px' }} className="rounded-3 overflow-hidden shadow-sm bg-light">
                                <img
                                    src={data.immagine}
                                    alt={data.titolo || 'Correlato'}
                                    className="w-100 h-100 object-fit-cover"
                                    style={{ objectPosition: 'top' }}
                                    loading="eager"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/media/placeholder.jpg'; }}
                                />
                            </div>
                        </div>
                    )}

                    <div className={data.immagine ? "col-12 col-md-7 d-flex flex-column" : "col-12 d-flex flex-column"}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h2 className="h3 fw-bold text-museo-primario mb-0">{data.titolo || 'Informazione'}</h2>

                            <div className="d-flex align-items-center gap-2">
                                <MicrofonoButton {...micProps} />
                                {errore && <small className="text-danger ms-2">{errore}</small>}
                                {!isSpeaking ? (
                                    <button type="button" className="btn btn-outline-dark btn-sm px-3 fw-semibold" onClick={() => playAudio(testoCorrelato)}>
                                        Ascolta
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-outline-danger btn-sm px-3 fw-semibold" onClick={stopAudio}>
                                        Interrompi
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="hero-card p-2 mb-3 shadow-sm">
                            <div className="row g-2 align-items-center">
                                <div className="col-6">
                                    <label htmlFor="select-tono-correlato" className="form-label micro-label fw-bold text-museo-primario mb-1">
                                        Linguaggio
                                    </label>
                                    <select id="select-tono-correlato" className="form-select form-select-sm" value={tonoCorrelato} onChange={(e) => setTonoCorrelato(e.target.value)}>
                                        <option value="infantile" disabled={!haTonoCorrelato('infantile')}>Infantile</option>
                                        <option value="semplice" disabled={!haTonoCorrelato('semplice')}>Semplice</option>
                                        <option value="medio" disabled={!haTonoCorrelato('medio')}>Medio</option>
                                        <option value="avanzato" disabled={!haTonoCorrelato('avanzato')}>Avanzato</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label htmlFor="select-durata-correlato" className="form-label micro-label fw-bold text-museo-primario mb-1">
                                        Durata Correlato
                                    </label>
                                    <select id="select-durata-correlato" className="form-select form-select-sm" value={durataCorrelato} onChange={(e) => setDurataCorrelato(e.target.value)}>
                                        <option value="3s" disabled={!haDurataCorrelato('3s')}>3 secondi</option>
                                        <option value="15s" disabled={!haDurataCorrelato('15s')}>15 secondi</option>
                                        <option value="1m" disabled={!haDurataCorrelato('1m')}>1 minuto</option>
                                        <option value="3m" disabled={!haDurataCorrelato('3m')}>3 minuti</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 p-3 bg-white flex-grow-1 shadow-sm">
                            <p className="text-secondary lh-base mb-0" style={{ minHeight: '120px' }}>{testoCorrelato}</p>
                        </div>
                    </div>
                </div>

                <div className="text-center border-top pt-3">
                    <button type="button" className="btn btn-museo-movimento btn-lg w-100 py-2" onClick={onTornaAllaVisita}>
                        Torna alla Visita (Tappa {indiceTappa + 1})
                    </button>
                </div>
            </div>
            {mostraHelp && (
                <Mappa
                    museo={museo}
                    infoSalaCorrente={infoSalaCorrente}
                    posizioneOpera={posizioneOpera}
                    dettaglioIniziale={dettaglioHelpIniziale}
                    onClose={onChiudiHelp}
                />
            )}
        </div>
    );
}