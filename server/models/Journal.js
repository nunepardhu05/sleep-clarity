// Journal.js - Mongoose Journal Schema
const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
  userId: {
    type: String, // Matches firebaseUid
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  mood: {
    type: String,
    enum: ['happy', 'tired', 'motivated', 'stressed', 'sad'],
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  aiAnalysis: {
    type: String,
    default: '',
  }
}, { timestamps: true });

module.exports = mongoose.model('Journal', JournalSchema);
