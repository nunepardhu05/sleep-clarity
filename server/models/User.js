// User.js - Mongoose User Schema
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
    default: '',
    index: true,
  },
  name: {
    type: String,
    default: '',
  },
  sleepTime: {
    type: String,
    default: '23:00',
  },
  wakeTime: {
    type: String,
    default: '07:00',
  },
  goal: {
    type: String,
    default: '',
  },
  monthlyGoals: {
    type: String,
    default: '',
  },
  yearlyGoals: {
    type: String,
    default: '',
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastActive: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
