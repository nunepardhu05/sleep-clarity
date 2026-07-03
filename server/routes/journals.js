// journals.js - Journal and pre-sleep reflection endpoints
const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal');
const verifyToken = require('../middleware/auth');

// GET all journals for the user
router.get('/', verifyToken, async (req, res) => {
  try {
    const journals = await Journal.find({ userId: req.user.uid }).sort({ date: -1 });
    res.json(journals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST save journal entry (creates new or updates existing for date)
router.post('/', verifyToken, async (req, res) => {
  const { content, mood, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Generate AI tone analysis locally on the server (or call live LLM client later)
    const aiAnalysis = generateAIToneAnalysis(content, mood);

    let journal = await Journal.findOne({ userId: req.user.uid, date: targetDate });

    if (journal) {
      journal.content = content;
      journal.mood = mood;
      journal.aiAnalysis = aiAnalysis;
    } else {
      journal = new Journal({
        userId: req.user.uid,
        content,
        mood,
        date: targetDate,
        aiAnalysis,
      });
    }

    await journal.save();
    res.status(200).json(journal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple server-side tone analysis rule block (acts as adapter/fallback)
function generateAIToneAnalysis(content, mood) {
  const contentLower = content.toLowerCase();
  let analysis = "";
  
  const moodResponses = {
    happy: "It is wonderful to see you ending your day on such a high note! Experiencing gratitude and happiness helps consolidate positive memories. Keep up this energetic wavelength for tomorrow.",
    tired: "You had a full, demanding day. Acknowledging physical and mental fatigue is a superpower. Rest is not a reward for productivity; it is the fuel for it. Sleep deep tonight.",
    motivated: "Your drive is inspiring. There is a strong fire in your reflections. Just make sure to transition into a calm wind-down state before shut-eye so you do not carry active cognitive loops into your sleep.",
    stressed: "It sounds like you carried a heavy weight today. Remember, you do not have to solve everything tonight. Exhale, leave today's worries on the page, and let sleep restore your perspective. You did your best.",
    sad: "I'm sending you a big warm hug. It is completely okay to have down days. Processing these emotions by writing is highly courageous. Allow yourself to rest without judgment tonight.",
  };

  analysis += moodResponses[mood] || "Thank you for reflecting tonight. Putting thoughts into words is the first step of clarity.";

  if (contentLower.includes("late") || contentLower.includes("sleep")) {
    analysis += " I noticed you mentioned sleep timing. Remember to protect your wind-down window. Unplugging 30 minutes before sleep could work wonders.";
  }
  if (contentLower.includes("work") || contentLower.includes("code") || contentLower.includes("project")) {
    analysis += " You poured significant mental capital into work today. Make sure tomorrow's plan has a distinct break to buffer your focus sessions.";
  }

  return analysis;
}

module.exports = router;
