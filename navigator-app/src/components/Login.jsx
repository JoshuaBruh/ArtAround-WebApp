import { useState } from 'react';
import { login } from '../api'; // Importa la funzione esportata dal modulo

export default function MiniLogin({ onSelectUtente }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errore, setErrore] = useState('');
    const [inCaricamento, setInCaricamento] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrore('');
        setInCaricamento(true);

        try {
            // Chiamata pulita: restituisce direttamente i dati JSON già risolti
            const data = await login(username, password);

            localStorage.setItem('artaround_utente', JSON.stringify(data));
            const utenteId = data.id_utente || data._id || data.username;
            onSelectUtente(utenteId, data.ruolo);
        } catch (err) {
            // Raccoglie il messaggio d'errore lanciato da handleResponse
            setErrore(err.message);
        } finally {
            setInCaricamento(false);
        }
    };
    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card-visita p-4 shadow-sm">
                        <h3 className="h4 fw-bold text-center mb-4 text-museo-primario">
                            Accedi al Navigator
                        </h3>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-3">
                                <label htmlFor="login-username" className="form-label fw-semibold">
                                    Username
                                </label>
                                <input
                                    id="login-username"
                                    type="text"
                                    className="form-control"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={inCaricamento}
                                    aria-required="true"
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="login-password" className="form-label fw-semibold">
                                    Password
                                </label>
                                <input
                                    id="login-password"
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={inCaricamento}
                                    aria-required="true"
                                />
                            </div>

                            {/* Messaggio d'errore accessibile */}
                            {errore && (
                                <div
                                    className="alert alert-danger p-2 fs-6 mb-3"
                                    role="alert"
                                    aria-live="assertive"
                                >
                                    {errore}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-museo-movimento w-100 mt-2"
                                disabled={inCaricamento}
                            >
                                {inCaricamento ? 'Accesso in corso...' : 'Accedi'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}