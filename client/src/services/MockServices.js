// MockServices.js - LocalStorage Database & Dynamic Express Network Router (Dual Mode)

const KEYS = new Proxy({}, {
  get: (target, prop) => {
    const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
    const mapping = {
      TASKS: `sleep_clarity_${uid}_tasks`,
      JOURNALS: `sleep_clarity_${uid}_journals`,
      PROFILE: `sleep_clarity_${uid}_profile`,
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
      }
    ];
    localStorage.setItem(KEYS.JOURNALS, JSON.stringify(initialJournals));
  }
};

seedData();

const getMode = () => {
  let mode = localStorage.getItem('sleep_clarity_connection_mode');
  if (!mode) {
    mode = 'fullstack';
    localStorage.setItem('sleep_clarity_connection_mode', mode);
  }
  return mode;
};
const getEndpoint = (path) => {
  let host = localStorage.getItem('sleep_clarity_server_url');
  const isLocalClient = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isLocalClient || !host || host.includes('localhost') || host.includes('127.0.0.1')) {
    host = 'https://sleep-clarity-api.onrender.com';
    localStorage.setItem('sleep_clarity_server_url', host);
  }
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
    const profile = JSON.parse(localStorage.getItem(KEYS.PROFILE));
    if (profile) {
      const calculatedStreak = MockServices.calculateStreakFromTasks();
      if (profile.streak !== calculatedStreak) {
        profile.streak = calculatedStreak;
        localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
        
        if (getMode() === 'fullstack') {
          fetch(getEndpoint('/api/users/streak/update'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ streak: calculatedStreak })
          }).catch(err => console.error("Error syncing streak count to server:", err));
        }
      }
    }
    return profile;
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

  clearUserData: async () => {
    if (getMode() === 'fullstack') {
      const response = await fetch(getEndpoint('/api/users/data'), {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to clear user data on database server.');
      }
      return await response.json();
    }
    return { success: true };
  },

  deleteAccount: async () => {
    if (getMode() === 'fullstack') {
      const response = await fetch(getEndpoint('/api/users/profile'), {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to delete account on database server.');
      }
      return await response.json();
    }
    return { success: true };
  },
  
  calculateStreakFromTasks: () => {
    const tasks = getFromStorage(KEYS.TASKS);
    if (tasks.length === 0) {
      return 0;
    }

    const tasksByDate = {};
    tasks.forEach(t => {
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
  },

  incrementStreak: () => {
    return MockServices.calculateStreakFromTasks();
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
    
    const entry = {
      id: existingIdx !== -1 ? all[existingIdx].id : `journal-${Date.now()}`,
      content,
      mood,
      date: todayStr,
    };

    if (existingIdx !== -1) {
      all[existingIdx] = entry;
    } else {
      all.push(entry);
    }
    
    saveToStorage(KEYS.JOURNALS, all);

    if (getMode() === 'fullstack') {
      fetch(getEndpoint('/api/journals'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content, mood, date: todayStr })
      }).catch(err => console.error("Server sync journal error:", err));
    }

    return entry;
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
    const currentProfile = JSON.parse(localStorage.getItem(KEYS.PROFILE) || '{}');
    const name = currentProfile.name || 'User';
    const sleepTime = currentProfile.sleepTime || '23:00';
    const wakeTime = currentProfile.wakeTime || '07:00';
    const phone = currentProfile.phone || '';
    const email = currentProfile.email || '';

    localStorage.removeItem(KEYS.TASKS);
    localStorage.removeItem(KEYS.JOURNALS);
    
    localStorage.setItem(KEYS.PROFILE, JSON.stringify({
      name,
      sleepTime,
      wakeTime,
      goal: '',
      streak: 0,
      lastActive: new Date().toISOString().split('T')[0],
      phone,
      email
    }));
    
    window.location.reload();
  }
};

