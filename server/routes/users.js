// users.js - User profile endpoints
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Journal = require('../models/Journal');
const verifyToken = require('../middleware/auth');

// GET user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      // Create profile on the fly if it doesn't exist
      user = new User({
        firebaseUid: req.user.uid,
        phone: req.user.phone || '',
        name: req.user.name || '',
      });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST update user profile
router.post('/profile', verifyToken, async (req, res) => {
  const { name, sleepTime, wakeTime, goal } = req.body;
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      user = new User({ firebaseUid: req.user.uid });
    }
    
    if (name !== undefined) user.name = name;
    if (sleepTime !== undefined) user.sleepTime = sleepTime;
    if (wakeTime !== undefined) user.wakeTime = wakeTime;
    if (goal !== undefined) user.goal = goal;
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST trigger daily active streak check
router.post('/streak', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (user.lastActive !== todayStr) {
      if (user.lastActive === yesterdayStr) {
        user.streak += 1;
      } else {
        user.streak = 1; // gap detected, reset streak
      }
      user.lastActive = todayStr;
      await user.save();
    }

    res.json({ streak: user.streak });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user profile & associated data
router.delete('/profile', verifyToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    await User.findOneAndDelete({ firebaseUid });
    await Task.deleteMany({ firebaseUid });
    await Journal.deleteMany({ firebaseUid });
    res.json({ success: true, message: 'User profile and all associated data deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
