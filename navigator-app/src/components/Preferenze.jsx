import { useState, useEffect } from 'react';
import { getVisita } from '../api';
import { CONFIG } from '../config';

export default function Preferenze({ visitaId, onStartPlayer }) {
    const [visita, setVisita] = useState(null);
    const [caricamento, setCaricamento] = useState(true);
    const [errore, setErrore] = useState('');

    // Valori di default coordinati con lo schema Item (descrizioni)
    const [tono, setTono] = useState('medio'); // 'infantile' | 'semplice' | 'medio' | 'avanzato'
    const [durataOpera, setDurataOpera] = useState('1m'); // '3s' | '15s' | '1m' | '3m'

    // Caricamento dei dati della visita scelta
    useEffect(() => {
        if (!visitaId) {
            setCaricamento(false);
            return;
        }

        setCaricamento(true);
        setErrore('');

        getVisita(visitaId)
            .then((data) => {
                if (CONFIG.id_museo && data.id_museo && String(data.id_museo) !== String(CONFIG.id_museo)) {
                    setErrore('Questa visita non appartiene a questo museo.');
                    return;
                }
                setVisita(data);
            })
            .catch((err) => {
                console.error("Errore nel recupero della visita:", err);
                setErrore("Impossibile caricare i dettagli della visita.");
            })
            .finally(() => setCaricamento(false));
    }, [visitaId]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Passa la configurazione iniziale al Player
        onStartPlayer({
            visitaId,
            visita,
            tonoIniziale: tono,
            durataIniziale: durataOpera
        });
    };

    if (caricamento) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Caricamento in corso...</span>
                </div>
                <p className="text-muted mt-2">Preparazione della visita...</p>
            </div>
        );
    }

    if (errore || !visita) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger text-center" role="alert">
                    {errore || "Visita non trovata."}
                </div>
            </div>
        );
    }
    const tappeValide = (visita.tappe || []).filter(t => t.item);
    if (tappeValide.length === 0) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning text-center" role="alert">
                    Questa visita non contiene opere riproducibili.
                </div>
            </div>
        );
    }


    // Opzioni Tono con descrizioni chiare per l'utente
    const opzioniTono = [
        { id: 'infantile', titolo: 'Infantile', desc: 'Concetti semplificati, ideale per bambini.' },
        { id: 'semplice', titolo: 'Semplice', desc: 'Spiegazioni chiare, senza gergo specialistico.' },
        { id: 'medio', titolo: 'Medio', desc: 'Equilibrato, con cenni storici e artistici accessibili.' },
        { id: 'avanzato', titolo: 'Avanzato', desc: 'Analisi approfondita con terminologia storico-artistica.' }
    ];

    // Opzioni Durata coordinate con i campi "3s", "15s", "1m", "3m" dello schema Item
    const opzioniDurata = [
        { id: '3s', label: '3s: ', desc: 'Un’occhiata d’insieme' },
        { id: '15s', label: '15s: ', desc: 'Punti chiave essenziali' },
        { id: '1m', label: '1min: ', desc: 'Spiegazione completa' },
        { id: '3m', label: '3min: ', desc: 'Analisi approfondita dell’opera' }
    ];

    return (
        <div className="container py-4" style={{ maxWidth: '800px' }}>
            {/* INTESTAZIONE E SUMMARY VISITA */}
            <div className="hero-card p-4 mb-4 shadow-sm text-center">
                <span className="badge bg-museo-terziario text-dark mb-2">Configurazione Guida</span>
                <h2 className="h3 fw-bold text-museo-primario mb-2">{visita.titolo}</h2>
                <p className="text-secondary small mb-3">
                    {visita.descrizione || 'Nessuna descrizione disponibile.'}
                </p>
                <div className="d-flex justify-content-center gap-4 text-muted small border-top pt-3">
                    <span> <strong>{tappeValide.length || 0}</strong> tappe previste</span>
                    <span> Durata stimata: <strong>{visita.durata_stimata_minuti || 30} min</strong></span>
                </div>
            </div>

            {/* FORM PREFERENZE */}
            <form onSubmit={handleSubmit}>
                {/* 1. SELEZIONE TONO / COMPLESSITÀ */}
                <fieldset className="hero-card p-4 mb-4 shadow-sm border-0">
                    <legend className="h5 fw-bold text-museo-primario mb-3">
                        1. Scegli il livello di dettaglio per le spiegazioni
                    </legend>
                    <p className="small text-muted mb-3">
                        Potrai comunque chiedere "Dimmi di più" o "Dimmi di meno" per ciascuna opera durante il percorso.
                    </p>

                    <div className="row row-cols-1 row-cols-sm-2 g-3">
                        {opzioniTono.map((item) => (
                            <div className="col" key={item.id}>
                                <label
                                    htmlFor={`tono-${item.id}`}
                                    className={`card h-100 p-3 cursor-pointer border-2  ${tono === item.id
                                        ? 'border-warning bg-white shadow-sm'
                                        : 'border-light bg-light opacity-90'
                                        }`}
                                >
                                    <div className="d-flex align-items-center mb-1">
                                        <input
                                            type="radio"
                                            id={`tono-${item.id}`}
                                            name="tono"
                                            value={item.id}
                                            checked={tono === item.id}
                                            onChange={(e) => setTono(e.target.value)}
                                            className="form-check-input me-2"
                                        />
                                        <strong className="text-dark">{item.titolo}</strong>
                                    </div>
                                    <span className="small text-muted ms-4">{item.desc}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </fieldset>

                {/* 2. SELEZIONE DURATA AUDIO PER OPERA */}
                <fieldset className="hero-card p-4 mb-4 shadow-sm border-0">
                    <legend className="h5 fw-bold text-museo-primario mb-3">
                        2. Scegli la durata base delle tracce audio
                    </legend>

                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-2">
                        {opzioniDurata.map((item) => (
                            <div className="col" key={item.id}>
                                <label
                                    htmlFor={`durata-${item.id}`}
                                    className={`card h-100 p-3 text-center cursor-pointer border-2  ${durataOpera === item.id
                                        ? 'border-warning bg-white shadow-sm'
                                        : 'border-light bg-light opacity-90'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        id={`durata-${item.id}`}
                                        name="durataOpera"
                                        value={item.id}
                                        checked={durataOpera === item.id}
                                        onChange={(e) => setDurataOpera(e.target.value)}
                                        className="form-check-input mx-auto mb-2"
                                    />
                                    <div className="fw-bold small text-dark mb-1">{item.label}</div>
                                    <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                        {item.desc}
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                </fieldset>

                {/* BOTTONE DI AVVIO */}
                <div className="text-center pt-2">
                    <button
                        type="submit"
                        className="btn btn-museo-movimento btn-lg w-100 py-3 shadow fs-5"
                    >
                        Inizia la Visita
                    </button>
                </div>
            </form>
        </div>
    );
}