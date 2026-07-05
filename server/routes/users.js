// users.js - User profile endpoints
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Journal = require('../models/Journal');
const verifyToken = require('../middleware/auth');

// Helper to calculate user streak from completed tasks
const calculateUserStreak = async (userId) => {
  const completedTasks = await Task.find({ userId, completed: true });
  if (completedTasks.length === 0) {
    return 0;
  }

  const uniqueDates = Array.from(new Set(completedTasks.map(t => t.date)));
  uniqueDates.sort((a, b) => new Date(b) - new Date(a));
  const datesSet = new Set(uniqueDates);

  const getLocalDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());
  const yesterdayStr = getLocalDateStr(new Date(Date.now() - 86400000));

  const hasToday = datesSet.has(todayStr);
  const hasYesterday = datesSet.has(yesterdayStr);

  if (!hasToday && !hasYesterday) {
    return 0;
  }

  let currentCheckDate = new Date();
  if (!hasToday && hasYesterday) {
    currentCheckDate = new Date(Date.now() - 86400000);
  }

  let streakCount = 0;
  while (true) {
    const checkDateStr = getLocalDateStr(currentCheckDate);
    if (datesSet.has(checkDateStr)) {
      streakCount++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streakCount;
};

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

    // Dynamically calculate and sync streak count
    const calculatedStreak = await calculateUserStreak(req.user.uid);
    if (user.streak !== calculatedStreak) {
      user.streak = calculatedStreak;
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

    const calculatedStreak = await calculateUserStreak(req.user.uid);
    user.streak = calculatedStreak;
    await user.save();

    res.json({ streak: user.streak });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST update streak explicitly from client
router.post('/streak/update', verifyToken, async (req, res) => {
  const { streak } = req.body;
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    user.streak = streak;
    await user.save();

    res.json({ success: true, streak: user.streak });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user data only (keep profile and credentials active)
router.delete('/data', verifyToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    await Task.deleteMany({ userId: firebaseUid });
    await Journal.deleteMany({ userId: firebaseUid });
    await User.findOneAndUpdate({ firebaseUid }, { streak: 0, goal: '' });
    res.json({ success: true, message: 'All user tasks and journal logs cleared successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user profile & associated data
router.delete('/profile', verifyToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    await User.findOneAndDelete({ firebaseUid });
    await Task.deleteMany({ userId: firebaseUid });
    await Journal.deleteMany({ userId: firebaseUid });
    res.json({ success: true, message: 'User profile and all associated data deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
