// Funzione di supporto per gestire gli errori HTTP in un unico punto
async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.errore || `Errore HTTP ${res.status}`);
  }
  return res.json();
}

// -----------------------------------------------------------------------------
// UTENTI & AUTH
// -----------------------------------------------------------------------------
/*
 * Esegue il login minimale
 * POST /api/auth/login
 */
export async function login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return handleResponse(res);
}

/*
 * Recupera i dati del profilo utente
 * GET /api/auth/utenti/:id_utente
 */
export async function getUtente(idUtente) {
  const res = await fetch(`/api/auth/utenti/${idUtente}`);
  return handleResponse(res);
}

// -----------------------------------------------------------------------------
// VISITE
// -----------------------------------------------------------------------------

/*
 * Recupera le visite adottate dall'utente (per il Navigator)
 * GET /api/visite/adottate/:id_utente
 */
export async function getVisiteAdottate(idUtente) {
  const res = await fetch(`/api/visite/adottate/${idUtente}`);
  return handleResponse(res);
}

/*
 * Recupera una visita con tutte le tappe già arricchite degli oggetti item completi
 * GET /api/visite/:id
 */
export async function getVisita(idVisita) {
  const res = await fetch(`/api/visite/${idVisita}`);
  return handleResponse(res);
}

export async function getVisiteAutore(idAutore, idMuseo) {
    const params = new URLSearchParams({ id_autore: idAutore });
    if (idMuseo) params.set('id_museo', idMuseo);
    const res = await fetch(`/api/visite?${params.toString()}`);
    return handleResponse(res);
}

// -----------------------------------------------------------------------------
// MUSEI & ITEMS (per mappa, indicazioni e riproduttore)
// -----------------------------------------------------------------------------

/*
 * Dettaglio completo del museo (sale, layout, info)
 * GET /api/musei/:id
 */
export async function getMuseo(idMuseo) {
  const res = await fetch(`/api/musei/${idMuseo}`);
  return handleResponse(res);
}

/*
 * Recupera un singolo item con descrizioni e media
 * GET /api/items/:id
 */
export async function getItem(idItem) {
  const res = await fetch(`/api/items/${idItem}`);
  return handleResponse(res);
}

// -----------------------------------------------------------------------------
// COMANDI VOCALI (LLM Router)
// -----------------------------------------------------------------------------

/*
 * Invia il trascritto vocale al server per la classificazione dell'intent
 * POST /api/voice-command
 */
export async function postVoiceCommand(testo) {
  const res = await fetch('/api/voice-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testo })
  });
  return handleResponse(res);
}