const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  id_oggetto: {
    type: String,
    required: [true, 'L\'id dell\'opera è obbligatorio']
  },
   opzionale: {type: Boolean, default: false}
}, { _id: false });

const visitSchema = new mongoose.Schema({
  id_visita: {
    type: String,
    required: true,
    unique: true
  },
  id_museo: {
    type: String,
    required: true
  },
  id_autore: {
    type: String,
    required: true
  },
  titolo: {
    type: String,
    required: true,
    trim: true
  },
  descrizione: {
    type: String,
    default: ""
  },
  prezzo_crediti: {
    type: Number,
    default: 0,
    min: [0, 'Il prezzo non può essere negativo']
  },
  pubblicata: {
    type: Boolean,
    default: false
  },
  data_pubblicazione: {
    type: Date,
    default: null
  },
  adozioni_totali: {
    type: Number,
    default: 0
  },
  durata_stimata_minuti: {
    type: Number,
    default: 30
  },
  immagine_copertina: {
    type: String,
    default: ""
  },
  tappe: [stepSchema]
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);