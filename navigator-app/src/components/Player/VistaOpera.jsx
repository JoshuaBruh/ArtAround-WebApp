import { useState } from 'react';
import Controlli from './Controlli';
import Mappa from './Mappa';
import MicrofonoButton from './MicrofonoButton';

export default function VistaOpera({
    indiceTappa, totaleTappe, titoloVisita,
    itemCorrente, infoSalaCorrente, museo,
    testoDescrizione, isSpeaking, playAudio, stopAudio,
    tono, setTono, durata, setDurata,
    onPrecedente, onProssima, eUltimaTappa,
    onApriCorrelato, caricamentoCorrelato,
    micProps, errore,
    mostraHelp, onApriHelp, onChiudiHelp, dettaglioHelpIniziale,
    onEsci
}) {

    const [espandiMappaPosizione, setEspandiMappaPosizione] = useState(false);
    const [mostraModalFoto, setMostraModalFoto] = useState(false);

    return (
        <div className="container py-3" style={{ maxWidth: '1100px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-museo-terziario text-dark me-1">Tappa {indiceTappa + 1} di {totaleTappe}</span>
                    <strong className="text-museo-primario d-none d-sm-inline">{titoloVisita}</strong>
                </div>

                <div className="d-flex gap-2 align-items-center">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onApriHelp}>
                        Aiuto / Sala
                    </button>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={onEsci}>
                        Esci
                    </button>
                </div>
            </div>

            <div className="row g-4 align-items-start">
                <div className="col-12 col-md-5">
                    <div className="card shadow-sm overflow-hidden mb-3 card-opera-hero p-0">
                        <div style={{ height: '480px' }} className="bg-light">
                            <img
                                src={itemCorrente.immagine || '/media/placeholder.jpg'}
                                alt={itemCorrente.titolo || 'Opera'}
                                className="w-100 h-100 object-fit-cover"
                                style={{ objectPosition: 'top', cursor: 'pointer' }}
                                title="Clicca per ingrandire"
                                loading="eager"
                                onClick={() => setMostraModalFoto(true)}
                                onError={(e) => { e.target.onerror = null; e.target.src = '/media/placeholder.jpg'; }}
                            />
                        </div>
                        <div className="card-body p-3 text-center border-top border-museo-terziario border-opacity-50">
                            <h2 className="h5 fw-bold text-museo-terziario mb-1">
                                {itemCorrente.titolo || 'Opera Senza Titolo'}
                            </h2>
                            <small className="text-secondary fw-semibold d-block">
                                Sala: {infoSalaCorrente?.nome || itemCorrente.id_sala || 'N/D'}
                            </small>
                        </div>
                    </div>

                    <div className="row row-cols-3 g-2">
                        <div className="col">
                            <button
                                type="button"
                                className="btn btn-museo-info w-100 h-100 border p-2 text-center shadow-sm"
                                onClick={() => onApriCorrelato(itemCorrente.id_artista, 'Artista')}
                                disabled={!itemCorrente.id_artista || caricamentoCorrelato}
                            >
                                <span className="small fw-semibold d-block text-truncate">Artista</span>
                            </button>
                        </div>
                        <div className="col">
                            <button
                                type="button"
                                className="btn btn-museo-info w-100 h-100 border p-2 text-center shadow-sm"
                                onClick={() => onApriCorrelato(itemCorrente.id_tecnica, 'Tecnica')}
                                disabled={!itemCorrente.id_tecnica || caricamentoCorrelato}
                            >
                                <span className="small fw-semibold d-block text-truncate">Tecnica</span>
                            </button>
                        </div>
                        <div className="col">
                            <button
                                type="button"
                                className="btn btn-museo-info w-100 h-100 border p-2 text-center shadow-sm"
                                onClick={() => onApriCorrelato(itemCorrente.id_movimento, 'Movimento')}
                                disabled={!itemCorrente.id_movimento || caricamentoCorrelato}
                            >
                                <span className="small fw-semibold d-block text-truncate">Movimento</span>
                            </button>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm mt-2 bg-light">
                        <button
                            type="button"
                            className="btn btn-sm btn-light w-100 text-start d-flex justify-content-between align-items-center p-2 border"
                            onClick={() => setEspandiMappaPosizione(!espandiMappaPosizione)}
                        >
                            <span className="fw-semibold small text-dark">Posizione Opera e Mappa</span>
                            <span className="small text-muted">{espandiMappaPosizione ? '▲ Nascondi' : '▼ Mostra'}</span>
                        </button>

                        {espandiMappaPosizione && (
                            <div className="card-body p-2 border-top bg-white">
                                <p className="small text-secondary mb-2">
                                    <strong>Posizione nell'ambiente:</strong> {itemCorrente.posizione || 'Non specificata'}
                                </p>
                                {museo?.mappa_generale && (
                                    <div className="text-center bg-dark rounded p-1">
                                        <img
                                            src={museo?.mappa_generale || '/media/placeholder.jpg'}
                                            alt="Mappa del Museo"
                                            className="img-fluid rounded"
                                            style={{ maxHeight: '180px', objectFit: 'contain' }}
                                            loading="lazy"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-12 col-md-7 align-self-start">
                    <div className="hero-card p-4 mb-3">
                        <div className="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-25 pb-2 mb-3">
                            <h3 className="h6 fw-bold text-museo-primario mb-0">Spiegazione dell'Opera</h3>
                            <div className="d-flex align-items-center gap-2">
                                {errore && <small className="text-danger me-1">{errore}</small>}
                                <MicrofonoButton {...micProps} />

                                {!isSpeaking ? (
                                    <button type="button" className="btn btn-outline-dark btn-sm px-3 fw-semibold" onClick={() => playAudio(testoDescrizione)}>
                                        Ascolta
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-outline-danger btn-sm px-3 fw-semibold" onClick={stopAudio}>
                                        Interrompi
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="lh-lg text-dark fs-6" style={{ minHeight: '140px' }}>{testoDescrizione}</p>
                    </div>

                    <Controlli
                        tono={tono}
                        setTono={setTono}
                        durata={durata}
                        setDurata={setDurata}
                        onPrecedente={onPrecedente}
                        onProssima={onProssima}
                        disabilitaPrecedente={false}
                        disabilitaProssima={false}
                        descrizioni={itemCorrente.descrizioni}
                        eUltimaTappa={eUltimaTappa}
                    />
                </div>
            </div>

            {mostraHelp && (
                <Mappa
                    museo={museo}
                    infoSalaCorrente={infoSalaCorrente}
                    posizioneOpera={itemCorrente.posizione}
                    dettaglioIniziale={dettaglioHelpIniziale}
                    onClose={onChiudiHelp}
                />
            )}

            {mostraModalFoto && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-85 d-flex justify-content-center align-items-center p-3"
                    style={{ zIndex: 1050, cursor: 'pointer' }}
                    onClick={() => setMostraModalFoto(false)}
                >
                    <div className="position-relative max-w-100 max-h-100" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="btn-close btn-close-white position-absolute top-0 end-0 m-3 z-3"
                            onClick={() => setMostraModalFoto(false)}
                        />
                        <img
                            src={itemCorrente.immagine || '/media/placeholder.jpg'}
                            alt={itemCorrente.titolo || 'Opera Ingrandita'}
                            className="img-fluid rounded shadow-lg"
                            loading="eager"
                            style={{ maxHeight: '88vh', maxWidth: '90vw', objectFit: 'contain' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}