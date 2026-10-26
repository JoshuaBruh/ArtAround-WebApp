const express = require('express');
const router = express.Router();
const Item = require('../models/item.js');
const PER_PAGINA_DEFAULT = 12;
// GET /api/items?id_museo=...&tipo=opera&pagina=1&per_pagina=10
// Lista con filtri base e paginazione — con centinaia/migliaia di contenuti
// non si può restituire tutto insieme, e non servono le 16 descrizioni
// complete solo per popolare una lista.

router.get('/', async (req, res) => {
    try {
        const { id_museo, tipo = 'opera', pagina = 1, per_pagina = PER_PAGINA_DEFAULT, id_sala, ricerca, ordina } = req.query;

        if (tipo === 'opera' && !id_museo) {
            return res.status(400).json({ errore: 'Parametro id_museo obbligatorio per le opere' });
        }

        const query = { tipo };

        if (tipo === 'opera') {
            if (id_museo) query.id_museo = id_museo;
            if (id_sala) query.id_sala = id_sala;
        } else if (id_museo) {
            // Artisti/movimenti/tecniche non hanno un proprio id_museo (sono
            // condivisi tra musei) — se viene passato id_museo, mostriamo solo
            // quelli referenziati da almeno un'opera DI QUEL museo, calcolato
            // con una singola query distinct(), non scaricando tutte le opere.
            const campoMap = { artista: 'id_artista', movimento: 'id_movimento', tecnica: 'id_tecnica' };
            const campo = campoMap[tipo];
            if (campo) {
                const idsReferenziati = await Item.distinct(campo, {
                    tipo: 'opera',
                    id_museo,
                    [campo]: { $nin: ['', null] }
                });
                query.id_oggetto = { $in: idsReferenziati };
            }
        }

        if (ricerca && ricerca.trim() !== '') {
            const escaped = ricerca.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'i');

            if (tipo === 'opera') {
                const correlatiTrovati = await Item.find({
                    tipo: { $in: ['artista', 'movimento', 'tecnica'] },
                    titolo: regex
                }).select('id_oggetto').lean();
                const idCorrelati = correlatiTrovati.map(c => c.id_oggetto);

                query.$or = [
                    { titolo: regex },
                    { id_oggetto: regex },
                    { id_artista: { $in: idCorrelati } },
                    { id_movimento: { $in: idCorrelati } },
                    { id_tecnica: { $in: idCorrelati } }
                ];
            } else {
                query.$or = [
                    { titolo: regex },
                    { id_oggetto: regex }
                ];
            }
        }

        let sortObj = {};
        if (ordina === 'titolo_asc') {
            sortObj = { titolo: 1 };
        } else if (ordina === 'titolo_desc') {
            sortObj = { titolo: -1 };
        }

        const pageNum = parseInt(pagina, 10) || 1;
        const limitNum = parseInt(per_pagina, 10) || PER_PAGINA_DEFAULT;
        const skip = (pageNum - 1) * limitNum;

        const [totale, items] = await Promise.all([
            Item.countDocuments(query),
            Item.find(query)
                .select('id_oggetto tipo titolo immagine id_sala id_movimento id_artista id_tecnica posizione id_autore')
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum)
                .lean()
        ]);

        let correlati = [];
        if (tipo === 'opera' && items.length > 0) {
            const idArtisti = items.map(i => i.id_artista).filter(Boolean);
            const idMovimenti = items.map(i => i.id_movimento).filter(Boolean);
            const idTecniche = items.map(i => i.id_tecnica).filter(Boolean);

            const idsUnici = [...new Set([...idArtisti, ...idMovimenti, ...idTecniche])];

            if (idsUnici.length > 0) {
                correlati = await Item.find({ id_oggetto: { $in: idsUnici } })
                    .select('id_oggetto tipo titolo')
                    .lean();
            }
        }

        res.json({
            items,
            totale,
            pagina: pageNum,
            per_pagina: limitNum,
            pagine_totali: Math.ceil(totale / limitNum) || 1,
            correlati
        });

    } catch (errore) {
        console.error('Errore durante il recupero elementi:', errore);
        res.status(500).json({ errore: 'Errore interno del server', dettaglio: errore.message });
    }
});

// GET /api/items/:id
// Item completo con tutte le descrizioni — usato dal Navigator per riprodurre
// e dall'Editor per modificare.
router.get('/:id', async (req, res) => {
    try {
        const item = await Item.findOne({ id_oggetto: req.params.id });
        if (!item) return res.status(404).json({ errore: 'Item non trovato' });
        res.json(item);
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

// POST /api/items — crea un nuovo item (Editor)
router.post('/', async (req, res) => {
    try {
        const item = await Item.create(req.body);
        res.status(201).json(item);
    } catch (e) {
        // Gestione errore chiave duplicata MongoDB (E11000)
        if (e.code === 11000) {

            const campoDuplicato = Object.keys(e.keyValue || {})[0] || 'id_oggetto';
            const valoreDuplicato = e.keyValue ? e.keyValue[campoDuplicato] : req.body.id_oggetto;

            return res.status(409).json({
                errore: `Esiste già un elemento con ${campoDuplicato} = "${valoreDuplicato}". Inserisci un valore univoco.`
            });
        }
        res.status(400).json({ errore: e.message });
    }
});

// PUT /api/items/:id — modifica un item esistente (Editor)
router.put('/:id', async (req, res) => {
    try {
        const item = await Item.findOneAndUpdate(
            { id_oggetto: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ errore: 'Item non trovato' });
        res.json(item);
    } catch (e) {
        res.status(400).json({ errore: e.message });
    }
});


// DELETE /api/items/:id — elimina un item (Editor)
router.delete('/:id', async (req, res) => {
    try {
        const item = await Item.findOneAndDelete({ id_oggetto: req.params.id });
        if (!item) return res.status(404).json({ errore: 'Item non trovato' });
        res.json({ messaggio: 'Item eliminato con successo' });
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

module.exports = router;
