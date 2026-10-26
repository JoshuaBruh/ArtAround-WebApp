const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id_utente: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Il nome utente è obbligatorio'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La password è obbligatoria']
  },
  ruolo: {
    type: String,
    required: true,
    enum: {
      values: ['visitatore', 'autore'],
      message: '{VALUE} non è un ruolo valido (visitatore, autore)'
    }
  },
  nome: {
    type: String,
    default: ""
  },
  credito: {
    type: Number,
    default: 0, 
    min: [0, 'Il credito non può essere negativo']
  },
  guadagno_totale: {
    type: Number,
    default: 0,
    min: [0, 'Il guadagno totale non può essere negativo']
  },
  visite_adottate: {
    type: [String],
    default: []
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);