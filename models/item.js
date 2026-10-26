const mongoose = require('mongoose');
const testoDettaglioSchema = {
  id_testo: { type: String, default: "" },
  testo: { type: String, default: "" }
};

const durateSchema = {
  "3s": testoDettaglioSchema,
  "15s": testoDettaglioSchema,
  "1m": testoDettaglioSchema,
  "3m": testoDettaglioSchema  
};


const itemSchema = new mongoose.Schema({
  tipo: { type: String, default: "opera" },
  id_oggetto: { type: String, required: true, unique: true },
  id_museo: { type: String },
  id_artista: { type: String },
  id_movimento: { type: String },
  id_tecnica: { type: String },
  titolo: { type: String, required: true },
  edificio: { type: String },
  id_sala: { type: String },
  posizione: { type: String },
  immagine: { type: String },
  licenza: { type: String },
  id_autore: { type: String },


  descrizioni: {
    infantile: { type: durateSchema },
    semplice: { type: durateSchema },
    medio: { type: durateSchema },
    avanzato: { type: durateSchema } 
  }
  
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);