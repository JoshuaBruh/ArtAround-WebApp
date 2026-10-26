export default function Controlli({
    tono,
    setTono,
    durata,
    setDurata,
    onPrecedente,
    onProssima,
    disabilitaPrecedente,
    disabilitaProssima,
    descrizioni,
    eUltimaTappa = false
}) {
    // Helper per verificare se il testo esiste per il tono selezionato e una specifica durata
    const haDurata = (d) => Boolean(descrizioni?.[tono]?.[d]?.testo);

    // Helper per verificare se un tono ha almeno una descrizione valida
    const haTono = (t) => Boolean(descrizioni?.[t] && Object.keys(descrizioni[t]).length > 0);

    return (
        <div className="d-flex flex-column gap-3">
            {/* Selezione Tono e Durata */}
            <div className="hero-card p-3 shadow-sm">
                <div className="row g-2 align-items-center">
                    <div className="col-6">
                        <label htmlFor="select-tono" className="form-label small fw-bold text-museo-primario mb-1">
                            Linguaggio
                        </label>
                        <select
                            id="select-tono"
                            className="form-select form-select-sm"
                            value={tono}
                            onChange={(e) => setTono(e.target.value)}
                        >
                            <option value="infantile" disabled={!haTono('infantile')}>Infantile</option>
                            <option value="semplice" disabled={!haTono('semplice')}>Semplice</option>
                            <option value="medio" disabled={!haTono('medio')}>Medio</option>
                            <option value="avanzato" disabled={!haTono('avanzato')}>Avanzato</option>
                        </select>
                    </div>
                    <div className="col-6">
                        <label htmlFor="select-durata" className="form-label small fw-bold text-museo-primario mb-1">
                            Durata
                        </label>
                        <select
                            id="select-durata"
                            className="form-select form-select-sm"
                            value={durata}
                            onChange={(e) => setDurata(e.target.value)}
                        >
                            <option value="3s" disabled={!haDurata('3s')}>3 secondi</option>
                            <option value="15s" disabled={!haDurata('15s')}>15 secondi</option>
                            <option value="1m" disabled={!haDurata('1m')}>1 minuto</option>
                            <option value="3m" disabled={!haDurata('3m')}>3 minuti</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Pulsanti Navigazione */}
            <div className="d-flex gap-2">
                <button
                    type="button"
                    className="btn btn-museo-movimento flex-grow-1 py-2 fw-semibold"
                    style={{ whiteSpace: 'pre-line' }}
                    onClick={onPrecedente}
                    disabled={disabilitaPrecedente}
                >
                    {"Opera Precedente\n\u2190"}
                </button>

                <button
                    type="button"
                    className={`btn ${eUltimaTappa ? 'btn-museo-info' : 'btn-museo-movimento'} flex-grow-1 py-2 fw-semibold`}
                    style={{ whiteSpace: 'pre-line' }}
                    onClick={onProssima}
                    disabled={disabilitaProssima}
                >
                    {eUltimaTappa ? 'Termina Visita' : "Prossima Opera\n\u2192"}
                </button>
            </div>
        </div>
    );
}