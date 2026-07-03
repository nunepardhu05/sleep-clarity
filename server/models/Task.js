// Task.js - Mongoose Task Schema
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: {
    type: String, // Matches firebaseUid
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  startTime: {
    type: String, // Format: HH:MM
    required: false,
    default: '',
  },
  endTime: {
    type: String, // Format: HH:MM
    required: false,
    default: '',
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  category: {
    type: String,
    default: 'work',
  },
  completed: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
