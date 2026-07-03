// Layout.jsx - Global Layout with Responsive Sidebar, Theme Toggle, and Notification Center
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Moon, Sun, LayoutDashboard, CheckSquare, BookOpen, 
  BarChart2, MessageSquare, Settings, LogOut, Menu, X, Bell, Flame, Calendar
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, profile, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'planning', text: 'Have you scheduled tomorrow\'s tasks? Clear your mind before sleep.', time: '10m ago', read: false },
    { id: 2, type: 'journal', text: 'Time to record your daily reflection and mood check.', time: '1h ago', read: false },
    { id: 3, type: 'morning', text: 'Wake up with purpose! Review your planned tasks.', time: '7h ago', read: true }
  ]);

  // Sync Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Background Notification Scheduler
  useEffect(() => {
    if (!profile) return;
    
    // Request permission on mount
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkTimeAndNotify = () => {
      const now = new Date();
      const currentHourMin = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
      
      const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
      const enabledMorning = localStorage.getItem(`sleep_clarity_${uid}_notif_morning`) !== 'false';
      const enabledUpcoming = localStorage.getItem(`sleep_clarity_${uid}_notif_upcoming`) !== 'false';
      const enabledPlanning = localStorage.getItem(`sleep_clarity_${uid}_notif_planning`) !== 'false';
      const enabledJournal = localStorage.getItem(`sleep_clarity_${uid}_notif_journal`) !== 'false';

      // 1. Morning Reminder (at wakeTime)
      if (enabledMorning && currentHourMin === profile.wakeTime) {
        const lastFired = localStorage.getItem(`sleep_clarity_${uid}_last_morning_fired`);
        if (lastFired !== currentHourMin) {
          localStorage.setItem(`sleep_clarity_${uid}_last_morning_fired`, currentHourMin);
          new Notification("Wake with Purpose ☀️", {
            body: `Good morning, ${profile.name}! It's ${profile.wakeTime}. Take 1 minute to check your scheduled focus blocks for today.`,
            icon: "/src/favicon.svg"
          });
        }
      }

      // 2. Night Planning Reminder (90 minutes before sleepTime)
      if (enabledPlanning) {
        const sleepMinutes = timeToMinutes(profile.sleepTime || '23:00');
        const planningMinutes = (sleepMinutes - 90 + 1440) % 1440;
        const planningTimeStr = minutesToTime(planningMinutes);
        
        if (currentHourMin === planningTimeStr) {
          const lastFired = localStorage.getItem(`sleep_clarity_${uid}_last_planning_fired`);
          if (lastFired !== currentHourMin) {
            localStorage.setItem(`sleep_clarity_${uid}_last_planning_fired`, currentHourMin);
            new Notification("Tomorrow Planner 🌙", {
              body: `Hey ${profile.name}, your bedtime is in 90 minutes. Let's dump tomorrow's tasks now to empty your mind.`,
              icon: "/src/favicon.svg"
            });
          }
        }
      }

      // 3. Pre-bed Journal Reminder (30 minutes before sleepTime)
      if (enabledJournal) {
        const sleepMinutes = timeToMinutes(profile.sleepTime || '23:00');
        const journalMinutes = (sleepMinutes - 30 + 1440) % 1440;
        const journalTimeStr = minutesToTime(journalMinutes);

        if (currentHourMin === journalTimeStr) {
          const lastFired = localStorage.getItem(`sleep_clarity_${uid}_last_journal_fired`);
          if (lastFired !== currentHourMin) {
            localStorage.setItem(`sleep_clarity_${uid}_last_journal_fired`, currentHourMin);
            new Notification("Evening Reflection 📝", {
              body: `Time to reflect, ${profile.name}. Log your mood and write today's journal entry to prepare for peaceful sleep.`,
              icon: "/src/favicon.svg"
            });
          }
        }
      }

      // 4. Upcoming Task Reminder (15 minutes prior to task start times)
      if (enabledUpcoming) {
        const todayStr = now.toISOString().split('T')[0];
        const tasksKey = `sleep_clarity_${uid}_tasks`;
        const tasks = JSON.parse(localStorage.getItem(tasksKey) || '[]');
        const todayTasks = tasks.filter(t => t.date === todayStr && !t.completed);

        todayTasks.forEach(task => {
          const taskStartMinutes = timeToMinutes(task.startTime);
          const alertMinutes = (taskStartMinutes - 15 + 1440) % 1440;
          const alertTimeStr = minutesToTime(alertMinutes);

          if (currentHourMin === alertTimeStr) {
            const lastFiredKey = `sleep_clarity_${uid}_last_task_fired_${task.id}`;
            const lastFired = localStorage.getItem(lastFiredKey);
            if (lastFired !== currentHourMin) {
              localStorage.setItem(lastFiredKey, currentHourMin);
              new Notification("Upcoming Focus block ⚡", {
                body: `"${task.title}" starts in 15 minutes (${task.startTime}). Prepare your focus zone.`,
                icon: "/src/favicon.svg"
              });
            }
          }
        });
      }
    };

    const timeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const minutesToTime = (minutes) => {
      const h = Math.floor(minutes / 60) % 24;
      const m = minutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    checkTimeAndNotify();
    const interval = setInterval(checkTimeAndNotify, 30000);

    return () => clearInterval(interval);
  }, [profile]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { nameKey: 'navDashboard', path: '/dashboard', icon: LayoutDashboard },
    { nameKey: 'todaysTasks', path: '/tasks', icon: CheckSquare },
    { nameKey: 'navCalendar', path: '/calendar', icon: Calendar },
    { nameKey: 'navJournal', path: '/journal', icon: BookOpen },
    { nameKey: 'navChat', path: '/chat', icon: MessageSquare },
    { nameKey: 'navSettings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0c18] text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      
      {/* Decorative ambient backdrop blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigoCalm-500/10 dark:bg-indigoCalm-900/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-dawn-500/5 dark:bg-dawn-900/5 blur-[120px] pointer-events-none z-0"></div>

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 w-full border-b border-slate-200 dark:border-slate-800 glass fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigoCalm-600 flex items-center justify-center text-white shadow-lg">
            <Moon className="w-4 h-4 fill-white" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Sleep Clarity</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-dawn-500"></span>
            )}
          </button>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </header>

      {/* MOBILE BACKDROP DRAWER OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop & Mobile Panel) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800/80
        glass-premium transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigoCalm-600 flex items-center justify-center text-white shadow-md shadow-indigoCalm-600/20">
              <Moon className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight block">Sleep Clarity</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">Self-Care Partner</span>
            </div>
          </div>
          <button 
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.nameKey}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-indigoCalm-500/10 dark:bg-indigoCalm-500/15 text-indigoCalm-600 dark:text-indigoCalm-400 border-l-[3px] border-indigoCalm-600 dark:border-indigoCalm-400 pl-3' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigoCalm-600 dark:text-indigoCalm-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {t(item.nameKey)}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Profile */}
        {profile && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 flex flex-col gap-3.5">
            {/* Streak card */}
            <div className="bg-dawn-500/10 dark:bg-dawn-500/10 rounded-xl p-3 flex items-center justify-between border border-dawn-500/20">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-dawn-500 fill-dawn-500 animate-pulse" />
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">{t('activeStreak')}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.streak} {t('streakDays')}</span>
                </div>
              </div>
              <span className="text-[10px] bg-dawn-500 text-white px-2 py-0.5 rounded-full font-bold">{t('active')}</span>
            </div>

            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-indigoCalm-100 dark:bg-slate-800 flex items-center justify-center font-bold text-indigoCalm-700 dark:text-indigoCalm-300">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Logged In</span>
                  <span className="text-sm font-semibold truncate block text-slate-800 dark:text-slate-200">{profile.name || 'User'}</span>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                title={t('navLogout')}
                className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 md:pt-0 pt-[68px]">
        {/* TOP NAVBAR (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800/40 glass">
          <div>
            <h1 className="font-display font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              {location.pathname.replace('/', '') || 'Home'}
            </h1>
          </div>

          {/* Real-time Digital Clock in 12-hour format */}
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigoCalm-500 animate-ping"></span>
            <span className="font-display font-bold text-xs tracking-wide text-slate-700 dark:text-slate-300">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-slate-500 dark:text-slate-400"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-slate-500 dark:text-slate-400"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-dawn-500 border-2 border-slate-50 dark:border-[#0a0c18]"></span>
              )}
            </button>

            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

            {/* Onboarding goals hint */}
            <div className="text-right hidden lg:block">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">PRODUCTIVITY TARGET</span>
              <span className="text-xs font-medium text-indigoCalm-600 dark:text-indigoCalm-400 block max-w-[200px] truncate">{profile?.goal || 'No goal set'}</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEW PORT */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:p-8">
          <div className="max-w-6xl mx-auto page-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* NOTIFICATIONS SLIDE DRAWER */}
      {notificationsOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50"
            onClick={() => setNotificationsOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 glass-premium border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-6 flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigoCalm-600 dark:text-indigoCalm-400" />
                <h3 className="font-display font-semibold text-lg">Notifications</h3>
              </div>
              <button 
                onClick={() => setNotificationsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 overflow-y-auto space-y-3.5">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`
                    p-3.5 rounded-xl border transition-all duration-200 relative
                    ${n.read 
                      ? 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400' 
                      : 'bg-white dark:bg-slate-800/60 border-indigoCalm-500/20 dark:border-indigoCalm-500/20 text-slate-800 dark:text-slate-100 shadow-xs'}
                  `}
                >
                  <p className="text-sm font-medium pr-3 leading-relaxed">{n.text}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-2 font-medium">{n.time}</span>
                  {!n.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-dawn-500"></span>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={markAllNotificationsRead}
              className="w-full py-2.5 bg-indigoCalm-600 dark:bg-indigoCalm-700 hover:bg-indigoCalm-700 dark:hover:bg-indigoCalm-600 text-white rounded-xl text-xs font-semibold tracking-wider transition-colors uppercase"
            >
              Mark All as Read
            </button>
          </div>
        </>
      )}

    </div>
  );
};

export default Layout;
