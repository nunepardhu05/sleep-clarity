// MockServices.js - LocalStorage Database & Dynamic Express Network Router (Dual Mode)

const KEYS = new Proxy({}, {
  get: (target, prop) => {
    const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
    const mapping = {
      TASKS: `sleep_clarity_${uid}_tasks`,
      JOURNALS: `sleep_clarity_${uid}_journals`,
      PROFILE: `sleep_clarity_${uid}_profile`,
      CHAT: `sleep_clarity_${uid}_chat`,
    };
    return mapping[prop];
  }
});

// Seed initial offline data if empty
const seedData = () => {
  if (localStorage.getItem('sleep_clarity_demo_seeded') === 'true') {
    return;
  }
  localStorage.setItem('sleep_clarity_demo_seeded', 'true');

  if (!localStorage.getItem(KEYS.PROFILE)) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify({
      name: 'Alex Developer',
      sleepTime: '23:00',
      wakeTime: '07:00',
      goal: 'Maintain consistent coding habit and sleep by 11 PM',
      streak: 5,
      lastActive: new Date().toISOString().split('T')[0],
      phone: '+1 (555) 019-2834',
    }));
  }

  if (!localStorage.getItem(KEYS.TASKS)) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const initialTasks = [
      {
        id: 'task-1',
        title: 'Review PRs and merge dev branch',
        description: 'Check team code changes and run tests.',
        date: today,
        startTime: '09:00',
        endTime: '10:30',
        priority: 'high',
        category: 'work',
        completed: true,
      },
      {
        id: 'task-2',
        title: 'Design UI layout in Figma',
        description: 'Draw mockups for the dashboard sleep chart.',
        date: today,
        startTime: '11:00',
        endTime: '13:00',
        priority: 'medium',
        category: 'design',
        completed: true,
      },
      {
        id: 'task-3',
        title: 'Gym session - cardio + core',
        description: '30 mins run and core workout.',
        date: today,
        startTime: '17:30',
        endTime: '18:45',
        priority: 'low',
        category: 'health',
        completed: false,
      },
      {
        id: 'task-4',
        title: 'Plan next sprint tasks',
        description: 'Outline tickets to complete tomorrow.',
        date: today,
        startTime: '21:30',
        endTime: '22:00',
        priority: 'medium',
        category: 'planning',
        completed: false,
      },
      {
        id: 'task-5',
        title: 'Refactor state management in Client',
        description: 'Move contextual states to Context Provider.',
        date: tomorrow,
        startTime: '09:30',
        endTime: '11:30',
        priority: 'high',
        category: 'work',
        completed: false,
      },
      {
        id: 'task-6',
        title: 'Read 5 chapters of atomic habits',
        description: 'Read and take notes.',
        date: tomorrow,
        startTime: '22:00',
        endTime: '22:30',
        priority: 'low',
        category: 'learning',
        completed: false,
      }
    ];
    localStorage.setItem(KEYS.TASKS, JSON.stringify(initialTasks));
  }

  if (!localStorage.getItem(KEYS.JOURNALS)) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const initialJournals = [
      {
        id: 'journal-1',
        content: 'Productive day today. Got the landing page layouts done and felt energized. Slept a bit late though, around 11:30 PM. Hope to sleep earlier tomorrow.',
        mood: 'motivated',
        date: yesterday,
        aiAnalysis: 'Your entry shows high excitement and self-reflection. You are motivated but notice a slight struggle with bedtime boundaries. Celebrating your design wins while maintaining your 11 PM target will protect your focus!'
      }
    ];
    localStorage.setItem(KEYS.JOURNALS, JSON.stringify(initialJournals));
  }

  if (!localStorage.getItem(KEYS.CHAT)) {
    const initialChat = [
      {
        id: 'm1',
        sender: 'ai',
        text: 'Hey there! I am your productivity companion. I help you map out your days, reflect before sleep, and keep your consistency high. How was your day today?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      }
    ];
    localStorage.setItem(KEYS.CHAT, JSON.stringify(initialChat));
  }
};

seedData();

// Dynamic Helper to detect mode
const getMode = () => localStorage.getItem('sleep_clarity_connection_mode') || 'fullstack';
const getEndpoint = (path) => {
  const host = localStorage.getItem('sleep_clarity_server_url') || 'https://sleep-clarity-api.onrender.com';
  return `${host}${path}`;
};
const getHeaders = () => {
  const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dev-mock-session-token',
    'X-User-UID': uid
  };
};

const getFromStorage = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const MockServices = {
  // PROFILE SERVICES
  getProfile: () => {
    // We keep profile returned synchronously to prevent UI blocking on bootstrap,
    // but settings update will sync it to DB.
    return JSON.parse(localStorage.getItem(KEYS.PROFILE));
  },
  
  updateProfile: (profileData) => {
    const current = MockServices.getProfile();
    const updated = { ...current, ...profileData };
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(updated));

    if (getMode() === 'fullstack') {
      fetch(getEndpoint('/api/users/profile'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      }).catch(err => console.error("Error syncing profile to server:", err));
    }

    return updated;
  },

  saveProfile: (profileData) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profileData));

    if (getMode() === 'fullstack') {
      fetch(getEndpoint('/api/users/profile'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      }).catch(err => console.error("Error syncing profile to server:", err));
    }

    return profileData;
  },

  incrementStreak: () => {
    const profile = MockServices.getProfile();
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (profile.lastActive !== todayStr) {
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = profile.streak;
      
      if (profile.lastActive === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      
      profile.streak = newStreak;
      profile.lastActive = todayStr;
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));

      if (getMode() === 'fullstack') {
        fetch(getEndpoint('/api/users/streak'), {
          method: 'POST',
          headers: getHeaders()
        }).catch(err => console.error("Error syncing streak count to server:", err));
      }
    }
    return profile.streak;
  },

  // TASK SERVICES
  getTasks: () => {
    return getFromStorage(KEYS.TASKS);
  },
  
  saveTasks: (tasks) => saveToStorage(KEYS.TASKS, tasks),

  getTasksByDate: (dateStr) => {
    const all = MockServices.getTasks();
    return all.filter(t => t.date === dateStr);
  },

  addTask: (task) => {
    const all = MockServices.getTasks();
    const newTask = {
      ...task,
      id: `task-${Date.now()}`,
      completed: false,
    };
    all.push(newTask);
    MockServices.saveTasks(all);
    MockServices.incrementStreak();

    if (getMode() === 'fullstack') {
      fetch(getEndpoint('/api/tasks'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(task)
      }).catch(err => console.error("Server sync task error:", err));
    }

    return newTask;
  },

  updateTask: (updatedTask) => {
    const all = MockServices.getTasks();
    const idx = all.findIndex(t => t.id === updatedTask.id);
    if (idx !== -1) {
      all[idx] = updatedTask;
      MockServices.saveTasks(all);

      if (getMode() === 'fullstack') {
        // Find DB ID mappings or pass ID directly
        const dbId = updatedTask._id || updatedTask.id;
        fetch(getEndpoint(`/api/tasks/${dbId}`), {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(updatedTask)
        }).catch(err => console.error("Server sync update task error:", err));
      }

      return updatedTask;
    }
    return null;
  },

  deleteTask: (id) => {
    const all = MockServices.getTasks();
    const filtered = all.filter(t => t.id !== id);
    MockServices.saveTasks(filtered);

    if (getMode() === 'fullstack') {
      fetch(getEndpoint(`/api/tasks/${id}`), {
        method: 'DELETE',
        headers: getHeaders()
      }).catch(err => console.error("Server sync delete task error:", err));
    }

    return true;
  },

  toggleTaskCompleted: (id) => {
    const all = MockServices.getTasks();
    const idx = all.findIndex(t => t.id === id);
    if (idx !== -1) {
      all[idx].completed = !all[idx].completed;
      MockServices.saveTasks(all);

      if (getMode() === 'fullstack') {
        fetch(getEndpoint(`/api/tasks/${id}/toggle`), {
          method: 'PATCH',
          headers: getHeaders()
        }).catch(err => console.error("Server sync toggle task error:", err));
      }

      return all[idx];
    }
    return null;
  },

  // JOURNAL SERVICES
  getJournals: () => getFromStorage(KEYS.JOURNALS),

  addJournalEntry: (content, mood) => {
    const all = MockServices.getJournals();
    const todayStr = new Date().toISOString().split('T')[0];
    const existingIdx = all.findIndex(j => j.date === todayStr);
    
    const aiAnalysis = MockServices.generateLocalAIJournalAnalysis(content, mood);
    
    const entry = {
      id: existingIdx !== -1 ? all[existingIdx].id : `journal-${Date.now()}`,
      content,
      mood,
      date: todayStr,
      aiAnalysis,
    };

    if (existingIdx !== -1) {
      all[existingIdx] = entry;
    } else {
      all.push(entry);
    }
    
    saveToStorage(KEYS.JOURNALS, all);
    MockServices.incrementStreak();

    if (getMode() === 'fullstack') {
      fetch(getEndpoint('/api/journals'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content, mood, date: todayStr })
      }).catch(err => console.error("Server sync journal error:", err));
    }

    return entry;
  },

  // LOCAL TONE ANALYSIS fallback
  generateLocalAIJournalAnalysis: (content, mood) => {
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
  },

  // LOCAL SCHEDULING ADVISOR
  getAIPlanSuggestions: (dateStr) => {
    const tasks = MockServices.getTasksByDate(dateStr);
    if (tasks.length === 0) {
      return ["No tasks scheduled yet. Take 5 minutes to write down your core focuses for tomorrow."];
    }

    const suggestions = [];
    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
    const workTasks = tasks.filter(t => t.category === 'work' || t.category === 'coding');
    
    if (tasks.length > 6) {
      suggestions.push("Tomorrow looks heavily packed with " + tasks.length + " tasks. Consider trimming down to your Top 3 Essential Focuses.");
    }
    if (highPriorityCount > 2) {
      suggestions.push("You've set " + highPriorityCount + " High Priority tasks. True prioritization means having only 1 or 2 absolute non-negotiables.");
    }

    let hasBackToBack = false;
    const sorted = [...tasks].sort((a,b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].endTime === sorted[i+1].startTime) {
        hasBackToBack = true;
        break;
      }
    }
    if (hasBackToBack) {
      suggestions.push("You have back-to-back blocks scheduled. Inserting a 15-minute buffer between tasks gives your brain time to reset.");
    }

    if (suggestions.length === 0) {
      suggestions.push("Your schedule for tomorrow is beautifully balanced. Excellent work spacing out your priorities!");
    }

    return suggestions;
  },

  // COMPANION AI CHAT
  getChatHistory: () => getFromStorage(KEYS.CHAT),

  saveChatHistory: (history) => saveToStorage(KEYS.CHAT, history),

  sendChatMessage: (userText) => {
    const all = MockServices.getChatHistory();
    const newUserMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };
    all.push(newUserMsg);
    MockServices.saveChatHistory(all);

    let aiText = "";
    
    if (getMode() === 'fullstack') {
      // In Full-stack mode, request real AI generation from the backend endpoint
      fetch(getEndpoint('/api/ai/chat'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: userText, chatHistory: all.slice(-5) })
      })
      .then(res => res.json())
      .then(data => {
        const newAiMsg = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply || "Connected backend failed to process response.",
          timestamp: new Date().toISOString()
        };
        all.push(newAiMsg);
        MockServices.saveChatHistory(all);
      })
      .catch(err => {
        console.error("Server chat generation error:", err);
      });
    }

    // Default immediate local generated response (acts as initial mock output or instant load)
    aiText = MockServices.generateAICompanionReply(userText);
    const newAiMsg = {
      id: `msg-ai-${Date.now()}`,
      sender: 'ai',
      text: aiText,
      timestamp: new Date(Date.now() + 500).toISOString(),
    };
    
    all.push(newAiMsg);
    MockServices.saveChatHistory(all);
    return { userMsg: newUserMsg, aiMsg: newAiMsg };
  },

  generateAICompanionReply: (userText) => {
    const textLower = userText.toLowerCase();
    const profile = MockServices.getProfile();
    const tasks = MockServices.getTasks();
    const journals = MockServices.getJournals();
    
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayStr);
    const completedToday = todayTasks.filter(t => t.completed).length;
    const totalToday = todayTasks.length;
    const completionPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    if (textLower.includes("hello") || textLower.includes("hi ") || textLower.includes("hey")) {
      return `Hey ${profile.name}! Hope you are winding down nicely. How has your productivity and clarity been today?`;
    }
    if (textLower.includes("progress") || textLower.includes("how did i do") || textLower.includes("completion") || textLower.includes("my day") || textLower.includes("tasks")) {
      if (totalToday === 0) {
        return `You didn't schedule any tasks for today. No worries! Have you scheduled tomorrow's tasks yet? It helps clear your mind before sleeping.`;
      }
      return `Today you scheduled ${totalToday} tasks and completed ${completedToday} of them (${completionPercent}%). Let's make sure tomorrow is organized so you can wake up with absolute purpose!`;
    }
    if (textLower.includes("streak")) {
      return `You are currently on a ${profile.streak}-day reflection streak! Keep it going tonight.`;
    }
    return `I completely get what you mean. Since we're wrapping up the day, my best recommendation is to review your tomorrow schedule, log a quick mood check in your journal, and let your brain fully recharge. Sleep with clarity, wake with purpose!`;
  },

  syncFromBackend: async () => {
    if (getMode() !== 'fullstack') return;
    try {
      console.log("[Full-Stack Mode] Synchronizing cache with server database...");
      
      // 1. Profile Sync
      const profileRes = await fetch(getEndpoint('/api/users/profile'), { headers: getHeaders() });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        localStorage.setItem(KEYS.PROFILE, JSON.stringify(profileData));
        console.log("Profile successfully synchronized.");
      }

      // 2. Tasks Sync
      const tasksRes = await fetch(getEndpoint('/api/tasks'), { headers: getHeaders() });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const formattedTasks = tasksData.map(t => ({
          ...t,
          id: t._id || t.id,
        }));
        localStorage.setItem(KEYS.TASKS, JSON.stringify(formattedTasks));
        console.log("Tasks successfully synchronized.");
      }

      // 3. Journals Sync
      const journalsRes = await fetch(getEndpoint('/api/journals'), { headers: getHeaders() });
      if (journalsRes.ok) {
        const journalsData = await journalsRes.json();
        const formattedJournals = journalsData.map(j => ({
          ...j,
          id: j._id || j.id,
        }));
        localStorage.setItem(KEYS.JOURNALS, JSON.stringify(formattedJournals));
        console.log("Journals successfully synchronized.");
      }
      
      console.log("[Full-Stack Mode] Cache sync completed successfully.");
    } catch (error) {
      console.error("Failed synchronizing data from Express server:", error);
    }
  },

  resetAllData: () => {
    localStorage.removeItem(KEYS.TASKS);
    localStorage.removeItem(KEYS.JOURNALS);
    localStorage.removeItem(KEYS.CHAT);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.setItem('sleep_clarity_demo_seeded', 'true');
    
    // Seed fresh clean profile
    localStorage.setItem(KEYS.PROFILE, JSON.stringify({
      name: 'Fresh User',
      sleepTime: '23:00',
      wakeTime: '07:00',
      goal: 'Manage schedule and sleep on time.',
      streak: 0,
      lastActive: new Date().toISOString().split('T')[0],
      phone: '',
    }));
    
    window.location.reload();
  }
};

