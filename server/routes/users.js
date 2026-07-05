// users.js - User profile endpoints
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Journal = require('../models/Journal');
const verifyToken = require('../middleware/auth');

// Helper to calculate user streak from completed tasks
const calculateUserStreak = async (userId) => {
  const allTasks = await Task.find({ userId });
  if (allTasks.length === 0) {
    return 0;
  }

  const tasksByDate = {};
  allTasks.forEach(t => {
    if (!t.date) return;
    if (!tasksByDate[t.date]) {
      tasksByDate[t.date] = [];
    }
    tasksByDate[t.date].push(t);
  });

  const activeDates = new Set();
  Object.keys(tasksByDate).forEach(dateStr => {
    const dayTasks = tasksByDate[dateStr];
    const allCompleted = dayTasks.length > 0 && dayTasks.every(t => t.completed);
    if (allCompleted) {
      activeDates.add(dateStr);
    }
  });

  const getLocalDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());
  const yesterdayStr = getLocalDateStr(new Date(Date.now() - 86400000));

  const hasToday = activeDates.has(todayStr);
  const hasYesterday = activeDates.has(yesterdayStr);

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
    if (activeDates.has(checkDateStr)) {
      streakCount++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streakCount;
};

// GET check if email exists (Public Route)
router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query parameter is required.' });

  try {
    // 1. Try Firebase Admin if initialized
    const admin = require('firebase-admin');
    if (admin.apps.length > 0) {
      try {
        await admin.auth().getUserByEmail(email);
        return res.json({ exists: true });
      } catch (firebaseErr) {
        if (firebaseErr.code === 'auth/user-not-found') {
          return res.json({ exists: false });
        }
        console.warn("Firebase Admin check failed, checking MongoDB:", firebaseErr.message);
      }
    }

    // 2. Fallback to MongoDB check
    const exists = await User.exists({ email: email.toLowerCase() });
    return res.json({ exists: !!exists });
  } catch (error) {
    console.error("Error in check-email route:", error);
    res.status(500).json({ error: error.message });
  }
});

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
        email: req.user.email || '',
      });
      await user.save();
    } else if (req.user.email && !user.email) {
      // Auto-migrate missing email field
      user.email = req.user.email.toLowerCase();
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
  const { name, email, sleepTime, wakeTime, goal, monthlyGoals, yearlyGoals } = req.body;
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      user = new User({ firebaseUid: req.user.uid });
    }
    
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (sleepTime !== undefined) user.sleepTime = sleepTime;
    if (wakeTime !== undefined) user.wakeTime = wakeTime;
    if (goal !== undefined) user.goal = goal;
    if (monthlyGoals !== undefined) user.monthlyGoals = monthlyGoals;
    if (yearlyGoals !== undefined) user.yearlyGoals = yearlyGoals;
    
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
