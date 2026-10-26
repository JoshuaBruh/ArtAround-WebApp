const express = require('express');
const router = express.Router();
const Visita = require('../models/visita.js');
const Item = require('../models/item.js');
const Utente = require('../models/utente.js');

// Arricchisce la prima tappa di ogni visita con i dati dell'item —
// serve come fallback per la copertina quando manca immagine_copertina.
async function arricchisciPrimeTappe(visite) {
    const idPrimeTappe = [...new Set(visite.map(v => v.tappe[0]?.id_oggetto).filter(Boolean))];
    const items = await Item.find({ id_oggetto: { $in: idPrimeTappe } })
        .select('id_oggetto titolo immagine')
        .lean();
    const itemsById = Object.fromEntries(items.map(i => [i.id_oggetto, i]));

    return visite.map(v => {
        const obj = v.toObject();
        if (obj.tappe.length > 0) {
            obj.tappe[0] = { ...obj.tappe[0], item: itemsById[obj.tappe[0].id_oggetto] || null };
        }
        return obj;
    });
}

// GET /api/visite?id_museo=...&id_autore=...
router.get('/', async (req, res) => {
    try {
        const filtro = {};
        if (req.query.id_museo) filtro.id_museo = req.query.id_museo;
        if (req.query.id_autore) filtro.id_autore = req.query.id_autore;

        if (req.query.solo_pubblicate === 'true' || req.query.pubblicata === 'true') {
            filtro.pubblicata = true;
        } else if (req.query.pubblicata === 'false') {
            filtro.pubblicata = false;
        }

        const visite = await Visita.find(filtro);

        const visiteArricchite = await arricchisciPrimeTappe(visite);

        res.json(visiteArricchite);
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});



// GET /api/visite/adottate/:id_utente - Recupera le visite acquistate dall'utente 
router.get('/adottate/:id_utente', async (req, res) => {
    try {
        const utente = await Utente.findOne({ id_utente: req.params.id_utente });
        if (!utente) return res.status(404).json({ errore: 'Utente non trovato' });

        const visite = await Visita.find({ id_visita: { $in: utente.visite_adottate } });

        const visiteArricchite = await arricchisciPrimeTappe(visite);

        res.json(visiteArricchite);
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});


// GET /api/visite/:id
// Restituisce la visita con le tappe già "arricchite" con i dati completi
// dell'item corrispondente — così il Navigator fa una sola chiamata invece
// di una richiesta per ogni tappa.
router.get('/:id', async (req, res) => {
    try {
        // 1. Cerca la visita nel DB
        const visita = await Visita.findOne({ id_visita: req.params.id });
        if (!visita) return res.status(404).json({ errore: 'Visita non trovata' });
        // 2. Estrae tutti gli ID delle opere presenti nelle tappe
        const idOggetti = visita.tappe.map(t => t.id_oggetto);
        // 3. Recupera in un'unica query tutte le opere corrispondenti a quegli ID
        const items = await Item.find({ id_oggetto: { $in: idOggetti } }).lean();

        const idArtisti = [...new Set(items.map(i => i.id_artista).filter(Boolean))];
        const artisti = await Item.find({ id_oggetto: { $in: idArtisti } }).lean();
        const artistiById = Object.fromEntries(
            artisti.map(a => [a.id_oggetto, a.titolo || a.id_oggetto])
        );

        // 4. Crea una Mappa (Dizionario) veloce per accedere agli item per ID
        const itemsById = Object.fromEntries(items.map(i => [
            i.id_oggetto,
            { ...i, nome_artista: artistiById[i.id_artista] || i.id_artista || '' }
        ]));
        // 5. Ricostruisce le tappe sostituendo l'ID con l'oggetto opera completo
        const tappeComplete = visita.tappe.map(t => ({
            id_oggetto: t.id_oggetto,
            opzionale: t.opzionale,
            item: itemsById[t.id_oggetto] || null
        }));

        res.json({ ...visita.toObject(), tappe: tappeComplete });
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

// POST /api/visite — crea una nuova visita (Editor)
router.post('/', async (req, res) => {
    try {
        const visita = await Visita.create(req.body);
        res.status(201).json(visita);
    } catch (e) {
        res.status(400).json({ errore: e.message });
    }
});

// PUT /api/visite/:id — modifica una visita (riordino tappe, pubblicazione, ecc.)
router.put('/:id', async (req, res) => {
    try {
        if (req.body.pubblicata === true) req.body.data_pubblicazione = new Date();
        const visita = await Visita.findOneAndUpdate(
            { id_visita: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!visita) return res.status(404).json({ errore: 'Visita non trovata' });
        res.json(visita);
    } catch (e) {
        res.status(400).json({ errore: e.message });
    }
});




// POST /api/visite/:id/adotta - Adotta una visita scalando il credito
router.post('/:id/adotta', async (req, res) => {
    try {
        const visita = await Visita.findOne({ id_visita: req.params.id });
        if (!visita) return res.status(404).json({ errore: 'Visita non trovata' });

        if (!visita.pubblicata) {
            return res.status(400).json({ errore: 'Non puoi adottare una visita non ancora pubblicata' });
        }

        const utente = await Utente.findOne({ id_utente: req.body.id_utente });
        if (!utente) return res.status(404).json({ errore: 'Utente non trovato' });

        if (utente.visite_adottate.includes(visita.id_visita)) {
            return res.status(409).json({ errore: 'Visita già adottata' });
        }
        if (utente.credito < visita.prezzo_crediti) {
            return res.status(402).json({ errore: 'Credito insufficiente' });
        }

        utente.credito -= visita.prezzo_crediti;
        utente.visite_adottate.push(visita.id_visita);
        await utente.save();

        visita.adozioni_totali += 1;
        await visita.save();

        if (visita.prezzo_crediti > 0) {
            await Utente.findOneAndUpdate(
                { id_utente: visita.id_autore },
                {
                    $inc: {
                        credito: visita.prezzo_crediti,
                        guadagno_totale: visita.prezzo_crediti
                    }
                }
            );
        }

        res.json({
            messaggio: 'Visita adottata con successo!',
            credito_residuo: utente.credito,
            visite_adottate: utente.visite_adottate
        });
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

// DELETE /api/visite/:id — Elimina una visita
router.delete('/:id', async (req, res) => {
    try {
        const visita = await Visita.findOne({ id_visita: req.params.id });
        if (!visita) return res.status(404).json({ errore: 'Visita non trovata' });

        if (visita.adozioni_totali > 0) {
            return res.status(400).json({
                errore: 'Non puoi eliminare una visita già adottata da altri utenti. Puoi solo rimuoverla dalle visite pubblicate.'
            });
        }

        await Visita.deleteOne({ id_visita: req.params.id });
        res.json({ messaggio: 'Visita eliminata con successo' });
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});


module.exports = router;

