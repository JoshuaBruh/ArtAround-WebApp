const mongoose = require('mongoose');

const salaSchema = new mongoose.Schema({
  nome: { type: String, default: "" },
  collocazione: { type: String, default: "" },
  nota_per_orientarsi: { type: String, default: "" },
  descrizione: { type: String, default: "" },
  ostacoli_accessibilita: { type: String, default: "Non sono presenti ostacoli di accessibilità all'interno della sala" }
}, { _id: false });


const museumSchema = new mongoose.Schema({
  id_museo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nome: {
    type: String,
    required: [true, 'Il nome del museo è obbligatorio']
  },
  immagine: {
    type: String,
    default: ".jpg"
  },
  citta: {
    type: String,
    required: true
  },
  costo: {
    type: String
  },
  info_generali: {
    type: String
  },
  indirizzi: {
    via: { type: String, default: "" },
    cap: { type: String, default: "" },
    provincia: { type: String, default: "" }
  },
  orari: {
    type: String
  },

  struttura_sale: {
    type: Map,
    of: salaSchema
  },
  mappa_generale: {
    type: String,
    default: ""
  },
  icona: { type:String, default: '/favicon.svg'},

  indicazioni_utili: {
    bagni: { type: String, default: "Non sono Presenti Bagni all'interno del museo" },
    uscita: { type: String, default: "" },
    entrata: { type: String, default: "" },
    uscite_emergenza: { type: String, default: "" },
    ascensori: { type: String, default: "Non sono Presenti Ascensori all'interno del museo" },
    scale: { type: String, default: "Non sono Presenti Scale all'interno del museo" },
    bar: { type: String, default: "Non sono Presenti Bar all'interno del museo" },
    shop: { type: String, default: "Non sono Presenti Shop all'interno del museo" },
  },

  social: {
    descrizione: {
      type: String,
      default: "Ecco i nostri canali social ufficiali per rimanere sempre aggiornati su mostre, eventi e attività."
    },
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" }
  },

  colori: {
    primario: { type: String, default: '#1b365d' },
    secondario: { type: String, default: '#8b0000' },
    terziario: { type: String, default: '#c5a059' },
    sfondo: { type: String, default: '#878a8b' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Museum', museumSchema);