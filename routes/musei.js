const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Museo = require('../models/museo.js');

// GET /api/musei
// Elenco musei per il pannello di scelta multipla nell'Editor.
// Solo i campi che servono in una lista, non tutte le 12 sale di dettaglio.
router.get('/', async (req, res) => {
    try {
        const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
        const perPagina = Math.max(1, parseInt(req.query.per_pagina) || 6);
        const citta = req.query.citta || '';
        const ricerca = req.query.ricerca || '';

        const filtro = {};

        // Filtro per Città
        if (citta) {
            const cittaEscaped = citta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filtro.citta = new RegExp(`^${cittaEscaped}$`, 'i');
        }

        // Filtro per Testo (ricerca parziale su nome o id_museo)
        if (ricerca) {
            const ricercaEscaped = ricerca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const r = { $regex: ricercaEscaped, $options: 'i' };
            filtro.$or = [{ nome: r }, { id_museo: r }];
        }

        const totale = await Museo.countDocuments(filtro);
        const pagineTotali = Math.ceil(totale / perPagina) || 1;

        const musei = await Museo.find(filtro, 'id_museo nome immagine citta costo orari info_generali indirizzi')
            .sort({ nome: 1 })
            .skip((pagina - 1) * perPagina)
            .limit(perPagina);

        res.json({
            musei,
            pagina,
            pagineTotali,
            totale
        });
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

// GET /api/musei/citta -> Restituisce l'elenco unico delle città nel DB
router.get('/citta', async (req, res) => {
    try {
        const citta = await Museo.distinct('citta');
        res.json(citta.filter(Boolean).sort());
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

// GET /api/musei/:id
// Dettaglio completo (sale, indicazioni utili) — usato sia dall'Editor sia
// dal Navigator per la mappa e le indicazioni logistiche.
router.get('/:id', async (req, res) => {
    try {
        const museo = await Museo.findOne({ id_museo: req.params.id });
        if (!museo) return res.status(404).json({ errore: 'Museo non trovato' });
        res.json(museo);
    } catch (e) {
        res.status(500).json({ errore: e.message });
    }
});

module.exports = router;
