// ai.js - Contextual AI Companion Router with Live Gemini API Client & Mock fallbacks
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const verifyToken = require('../middleware/auth');
const Task = require('../models/Task');
const Journal = require('../models/Journal');
const User = require('../models/User');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Generative AI Client initialized with Gemini Key.");
  } catch (err) {
    console.error("Failed to initialize Google Generative AI client:", err);
  }
}

// POST chat message with full context
router.post('/chat', verifyToken, async (req, res) => {
  const { message, chatHistory } = req.body;
  const userId = req.user.uid;

  try {
    // 1. Gather all user context to feed to AI
    const user = await User.findOne({ firebaseUid: userId });
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const tasks = await Task.find({ userId });
    const journals = await Journal.find({ userId }).sort({ date: -1 }).limit(3);

    const todayTasks = tasks.filter(t => t.date === todayStr);
    const tomorrowTasks = tasks.filter(t => t.date === tomorrowStr);
    const completedToday = todayTasks.filter(t => t.completed).length;
    
    const contextPrompt = `
You are the "Clarity Companion", a supportive, friendly accountability partner and sleep wind-down buddy. 
Your goal is to help the user reflect on their day, outline tomorrow's tasks before bed (to reduce anxiety), and ensure they maintain healthy sleep boundaries.

Do NOT act like a generic robotic search assistant. Be conversational, emotionally intelligent, warm, and encourage structure.

Here is the current user state for context:
- User Name: ${user?.name || 'Friend'}
- Target Bedtime: ${user?.sleepTime || '23:00'} (suggest screen wind-down 30m prior)
- Target Wake-up time: ${user?.wakeTime || '07:00'}
- Productivity Goal: ${user?.goal || 'No custom goal set'}
- Daily Streak: ${user?.streak || 1} days active
- Today's tasks completion: ${completedToday} completed out of ${todayTasks.length} total.
- Tomorrow's scheduled load: ${tomorrowTasks.length} tasks scheduled.
- Recent Mood Logs: ${journals.map(j => `[Date: ${j.date}, Mood: ${j.mood}, Reflection: "${j.content.substring(0, 80)}..."]`).join('; ')}

User's query: "${message}"
`;

    // 2. Route to Live Gemini if available
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Convert basic chat history into Gemini content structure
      const formattedHistory = (chatHistory || []).slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Initialize Clarity Companion context instructions.' }]
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I will act as the warm Clarity Companion, keeping track of task completion percentages, streaks, sleep hours, and journal logs. I will respond to the user warmly, encouraging healthy boundaries and sleep planning.' }]
          },
          ...formattedHistory
        ],
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.7,
        }
      });

      const result = await chat.sendMessage(contextPrompt);
      const response = await result.response;
      return res.json({ reply: response.text() });
    }

    // 3. Fallback to Local AI Rule Generator if no key is set
    const fallbackReply = generateOfflineCompanionReply(message, user, todayTasks, tomorrowTasks, journals);
    return res.json({ reply: fallbackReply });

  } catch (error) {
    console.error("AI Router error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Server-side fallback reply engine (identical to MockServices but runs on Express)
function generateOfflineCompanionReply(message, user, todayTasks, tomorrowTasks, journals) {
  const textLower = message.toLowerCase();
  const userName = user?.name || 'Friend';
  const streak = user?.streak || 1;
  const sleepTime = user?.sleepTime || '23:00';
  
  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalToday = todayTasks.length;
  const completionPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  if (textLower.includes("hello") || textLower.includes("hi ") || textLower.includes("hey")) {
    return `Hey ${userName}! Hope you are winding down nicely. How has your productivity and clarity been today?`;
  }
  if (textLower.includes("progress") || textLower.includes("how did i do") || textLower.includes("completion") || textLower.includes("my day") || textLower.includes("tasks")) {
    if (totalToday === 0) {
      return `You didn't schedule any tasks for today. No worries! Rest is just as important. Have you scheduled tomorrow's tasks yet? It helps clear your mind before sleeping.`;
    }
    let reply = `Today you completed ${completedToday} of your ${totalToday} tasks (${completionPercent}%). `;
    if (completionPercent === 100) reply += "Perfect focus today! Celebrate this victory.";
    else if (completionPercent >= 70) reply += "Solid consistency. Let go of whatever is left.";
    else reply += "You got some focus blocks in, and that is what counts. Tomorrow is a new slate.";
    return reply;
  }
  if (textLower.includes("streak")) {
    return `You are currently on a ${streak}-day reflection streak! Keep it going tonight.`;
  }
  return `I understand. As you prepare for bed, make sure you've scheduled your tomorrow's tasks to empty your active memory. Let's aim to shut down screens soon to protect your ${sleepTime} sleep window!`;
}

module.exports = router;
