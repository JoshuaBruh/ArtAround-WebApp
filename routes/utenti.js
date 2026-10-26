const express = require('express');
const router = express.Router();
const Utente = require('../models/utente.js');

// POST /api/auth/login
// body: { username, password }
// Login volutamente semplice (niente sessioni/JWT): il frontend riceve i dati
// dell'utente e li tiene in memoria per la durata dell'uso dell'app.
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const utente = await Utente.findOne({ username });

        if (!utente || utente.password !== password) {
            return res.status(401).json({ errore: 'Credenziali non valide' });
        }

        res.json({
            id_utente: utente.id_utente,
            username: utente.username,
            ruolo: utente.ruolo,
            nome: utente.nome,
            credito: utente.credito,
            guadagno_totale: utente.guadagno_totale || 0,
            visite_adottate: utente.visite_adottate || []
        });
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

//GET /api/auth/utenti/:id_utente - Recupera i dati aggiornati del profilo utente
router.get('/utenti/:id_utente', async (req, res) => {
    try {
        const utente = await Utente.findOne({ id_utente: req.params.id_utente }).select('-password');
        if (!utente) {
            return res.status(404).json({ errore: 'Utente non trovato' });
        }
        res.json(utente);
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

module.exports = router;
