/*
File: index.js
Author: Fabio Vitali
Version: 1.0 
Last change on: 2 April 2024


Copyright (c) 2024 by Fabio Vitali

   Permission to use, copy, modify, and/or distribute this software for any
   purpose with or without fee is hereby granted, provided that the above
   copyright notice and this permission notice appear in all copies.

   THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
   SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
   OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
   CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.


    (gocker): start node-22 site252645 index.js
    (gocker): logs site252645
*/



/* ========================== */
/*                            */
/*           SETUP            */
/*                            */
/* ========================== */
require('dotenv').config({ path: __dirname + '/.env' });
global.rootDir = __dirname;
global.startDate = null;



const express = require('express');
const cors = require('cors')
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');


const Utente = require('./models/utente.js');
const Museo = require('./models/museo.js');
const Item = require('./models/item.js');
const Visita = require('./models/visita.js');


const itemsRouter = require('./routes/items.js');
const museiRouter = require('./routes/musei.js');
const visiteRouter = require('./routes/visite.js');
const utentiRouter = require('./routes/utenti.js');
const voiceCommandRouter = require('./routes/voiceCommand.js');


/* ========================== */
/*                            */
/*  EXPRESS CONFIG & ROUTES   */
/*                            */
/* ========================== */

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.enable('trust proxy');


// Servire Editor e Navigator
app.use('/editor', express.static(path.join(global.rootDir, 'public/editor')));
app.use('/navigator', express.static(path.join(global.rootDir, 'public/navigator')));
app.use('/media', express.static(path.join(global.rootDir, 'public/media')));


app.use('/api/items', itemsRouter);
app.use('/api/musei', museiRouter);
app.use('/api/visite', visiteRouter);
app.use('/api/auth', utentiRouter);
app.use('/api/voice-command', voiceCommandRouter);


// Rotta Principale
app.get('/', (req, res) => {
    res.redirect('/navigator/');
});


/* ========================== */
/*                            */
/*           MONGODB          */
/*       using mongoose       */
/* ========================== */



async function seedDatabase() {
    try {
        // Flag esplicito: si attiva solo se FORCE_RESEED=true nel file .env 
        // oppure se lanci il server con: node index.js --reseed
        const forceReseed = process.env.FORCE_RESEED === 'true' || process.argv.includes('--reseed');

        if (forceReseed) {
            console.log('⚠️ [Seed] Reset forzato richiesto: svuotamento collezioni...');
            await Item.deleteMany({});
            await Visita.deleteMany({});
            await Museo.deleteMany({});
            await Utente.deleteMany({});
        }

        // UTENTI (semina solo se la collezione è VUOTA)
        const countUtenti = await Utente.countDocuments();
        if (countUtenti === 0) {
            const dataPath = path.join(__dirname, 'data', 'utenti.json');
            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
                if (data.length > 0) {
                    await Utente.insertMany(data);
                    console.log('✓ [Seed] Inseriti utenti iniziali.');
                }
            }
        }

        // MUSEI
        const countMusei = await Museo.countDocuments();
        if (countMusei === 0) {
            const dataPath = path.join(__dirname, 'data', 'musei.json');
            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
                if (data.length > 0) await Museo.insertMany(data);
                console.log('✓ [Seed] Inseriti musei iniziali.');
            }
        }

        // ITEMS 
        const countItems = await Item.countDocuments();
        if (countItems === 0) {
            const dataPath = path.join(__dirname, 'data', 'items.json');
            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
                if (data.length > 0) await Item.insertMany(data);
                console.log("✓ [Seed] Inserite opere d'arte iniziali.");
            }
        }

        // VISITE
        const countVisite = await Visita.countDocuments();
        if (countVisite === 0) {
            const dataPath = path.join(__dirname, 'data', 'visite.json');
            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
                if (data.length > 0) await Visita.insertMany(data);
                console.log('✓ [Seed] Inserite visite iniziali.');
            }
        }

    } catch (error) {
        console.error('⚠️ Errore durante il popolamento del database:', error);
    }
}

// Riconoscimento ambiente tramite variabile o path
const isGocker = process.env.AMBIENTE === 'gocker';
// Costruzione URI da variabili d'ambiente (NIENTE password in chiaro nel codice!)
const mongoURI = isGocker
    ? `mongodb://${process.env.MONGO_GOCKER_USER}:${process.env.MONGO_GOCKER_PWD}@${process.env.MONGO_GOCKER_SITE}/${process.env.MONGO_GOCKER_SITE}?authSource=admin`
    : process.env.MONGO_ATLAS_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        console.log(`✓ Mongoose connesso con successo (${isGocker ? 'Gocker Server' : 'MongoDB Atlas Cloud'})`);
        await seedDatabase();
    })
    .catch(err => console.error('⚠️ Errore di connessione Mongoose:', err));



/* ========================== */
/*                            */
/*    ACTIVATE NODE SERVER    */
/*                            */
/* ========================== */

const PORT = process.env.PORT || 8000;
app.listen(PORT, function () {
    global.startDate = new Date();
    console.log(`App listening on port ${PORT} started ${global.startDate.toLocaleString()}`)
    console.log(`Marketplace Editor: http://localhost:${PORT}/editor/`);
})


/*       END OF SCRIPT        */
