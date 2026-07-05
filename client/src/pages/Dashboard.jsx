// Dashboard.jsx - Modern, Calm Productivity Dashboard
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockServices } from '../services/MockServices';
import { 
  Flame, CheckCircle2, Circle, AlertCircle, Sparkles, 
  ArrowRight, Plus, Calendar, Clock, BookOpen, Star, Trash2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const Dashboard = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minStr} ${ampm}`;
  };
  
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const [todayTasks, setTodayTasks] = useState([]);
  const [tomorrowTasks, setTomorrowTasks] = useState([]);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('work');
  const [quickPriority, setQuickPriority] = useState('medium');
  const [journalCompleted, setJournalCompleted] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const todayList = MockServices.getTasksByDate(todayStr);
    const tomorrowList = MockServices.getTasksByDate(tomorrowStr);
    setTodayTasks(todayList);
    setTomorrowTasks(tomorrowList);
    


    // Check if journal for today is written
    const journals = MockServices.getJournals();
    const journaledToday = journals.some(j => j.date === todayStr);
    setJournalCompleted(journaledToday);
  };

  const handleToggleTask = (id) => {
    MockServices.toggleTaskCompleted(id);
    loadData();
  };

  const handleQuickAddTomorrow = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    MockServices.addTask({
      title: quickTitle,
      description: 'Quick task planned from dashboard.',
      date: tomorrowStr,
      startTime: '',
      endTime: '',
      priority: quickPriority,
      category: quickCategory,
    });

    setQuickTitle('');
    loadData();
  };

  // Math metrics
  const completedCount = todayTasks.filter(t => t.completed).length;
  const totalCount = todayTasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Chart data: past 7 days task completion
  const getChartData = () => {
    const data = [];
    const allTasks = MockServices.getTasks();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const tasksOnDate = allTasks.filter(t => t.date === dateStr);
      
      const done = tasksOnDate.filter(t => t.completed).length;
      const total = tasksOnDate.length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      data.push({ name: label, completion: rate, count: total });
    }
    return data;
  };

  const chartData = getChartData();

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      
      {/* 1. GREETING HERO CARD */}
      <div className="glass-premium rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between items-start gap-6 relative overflow-hidden">
        {/* Glow behind greeting */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-indigoCalm-500/10 dark:bg-indigoCalm-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">{t('welcome')}</span>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight mb-2">
            {getGreeting()}, {profile?.name || 'User'}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-light">
            {t('settingsSub')}
          </p>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak card */}
        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t('activeStreak')}</span>
            <p className="text-3xl font-display font-extrabold">{profile?.streak || 0} {t('streakDays')}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Log entries before sleep</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-dawn-500/10 flex items-center justify-center text-dawn-500">
            <Flame className="w-8 h-8 fill-dawn-500 animate-pulse" />
          </div>
        </div>

        {/* Completion percentage card */}
        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Today's Focus</span>
            <p className="text-3xl font-display font-extrabold">{completionPercent}%</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {completedCount} of {totalCount} tasks completed
            </span>
          </div>
          {/* Radial progress representation */}
          <div className="relative w-14 h-14">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="28" cy="28" r="22" 
                className="stroke-slate-200 dark:stroke-slate-800 fill-none" 
                strokeWidth="4"
              />
              <circle 
                cx="28" cy="28" r="22" 
                className="stroke-indigoCalm-500 fill-none transition-all duration-500" 
                strokeWidth="4" 
                strokeDasharray={138} 
                strokeDashoffset={138 - (138 * completionPercent) / 100}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Tomorrow planner card */}
        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Tomorrow's Load</span>
            <p className="text-3xl font-display font-extrabold">{tomorrowTasks.length} Planned</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Worry-free bedtime guaranteed</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigoCalm-500/10 flex items-center justify-center text-indigoCalm-500">
            <Calendar className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Tasks (2/3 span on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TODAY'S SCHEDULE */}
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display font-bold text-lg">{t('todaysTasks')}</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">{t('journalSub')}</span>
              </div>
              <Link 
                to="/tasks" 
                className="text-xs font-semibold text-indigoCalm-600 dark:text-indigoCalm-400 hover:underline flex items-center gap-1"
              >
                {t('navCalendar')}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-400 dark:text-slate-500 font-light">No tasks scheduled for today. Have you planned tomorrow?</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {todayTasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => handleToggleTask(task.id)}
                    className={`
                      p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between
                      ${task.completed 
                        ? 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800/50 opacity-60' 
                        : 'bg-white dark:bg-[#14182b] border-slate-200 dark:border-slate-800/50 hover:border-indigoCalm-500/20 shadow-xs'}
                    `}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button className="text-indigoCalm-500 hover:scale-105 transition-transform flex-shrink-0">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-indigoCalm-500 fill-indigoCalm-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                      
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {task.title}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
                          {task.startTime ? `${formatTimeTo12Hour(task.startTime)} - ${formatTimeTo12Hour(task.endTime)} • ` : ''}
                          <span className="uppercase text-[9px] font-bold tracking-wider">{task.category}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`
                        text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                        ${task.priority === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
                        ${task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : ''}
                        ${task.priority === 'low' ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : ''}
                      `}>
                        {task.priority === 'high' ? t('high') : task.priority === 'medium' ? t('medium') : t('low')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WEEKLY TRENDS GRAPH */}
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
            <h3 className="font-display font-bold text-lg mb-4">Weekly Consistency</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c76ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c76ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value}%`, 'Completion Rate']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completion" 
                    stroke="#7c76ee" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorComp)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Tomorrow Planning */}
        <div className="space-y-6">
          


          {/* TOMORROW QUICK PLANNING CARD */}
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-base">Plan for Tomorrow</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Pre-sleep check</span>
            </div>

            {/* Quick Tomorrow list */}
            {tomorrowTasks.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light">No tasks scheduled yet. Start writing down your targets to clear your head.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                {tomorrowTasks.map((task) => (
                  <div key={task.id} className="p-2.5 bg-slate-100/50 dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold truncate max-w-[140px]">{task.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-bold uppercase">{task.category}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${task.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'}`}>{task.priority}</span>
                      <button
                        type="button"
                        onClick={() => {
                          MockServices.deleteTask(task.id);
                          loadData();
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/80 transition-colors"
                        title="Delete Tomorrow Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleQuickAddTomorrow} className="space-y-3 pt-3 border-t border-slate-250 dark:border-slate-800">
              <div>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111326] border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="px-2 py-2 bg-slate-50 dark:bg-[#111326] border border-slate-250 dark:border-slate-800 rounded-xl text-[10px] font-semibold focus:outline-hidden"
                >
                  <option value="work">Work</option>
                  <option value="coding">Coding</option>
                  <option value="learning">Learning</option>
                  <option value="health">Health</option>
                  <option value="design">Design</option>
                  <option value="planning">Planning</option>
                </select>

                <select
                  value={quickPriority}
                  onChange={(e) => setQuickPriority(e.target.value)}
                  className="px-2 py-2 bg-slate-50 dark:bg-[#111326] border border-slate-250 dark:border-slate-800 rounded-xl text-[10px] font-semibold focus:outline-hidden"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule for Tomorrow
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
