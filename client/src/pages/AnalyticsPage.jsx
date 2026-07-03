// AnalyticsPage.jsx - Rich Charts for Productivity Trends, Task Categories, and Mood Logs
import React, { useState, useEffect } from 'react';
import { MockServices } from '../services/MockServices';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, CheckSquare, Flame, Smile, TrendingUp, Award } from 'lucide-react';

const AnalyticsPage = () => {
  const [taskData, setTaskData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalScheduled: 0,
    avgCompletion: 0,
    currentStreak: 0,
    dominantMood: 'motivated',
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    const allTasks = MockServices.getTasks();
    const allJournals = MockServices.getJournals();
    const profile = MockServices.getProfile();

    // 1. Weekly completion trend data (past 7 days)
    const weeklyData = [];
    let completedCount = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const tasksOnDate = allTasks.filter(t => t.date === dateStr);
      
      const done = tasksOnDate.filter(t => t.completed).length;
      const total = tasksOnDate.length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      
      completedCount += done;
      weeklyData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        'Completion Rate': rate,
        'Tasks Completed': done
      });
    }
    setTaskData(weeklyData);

    // 2. Category distributions
    const categories = ['work', 'coding', 'learning', 'health', 'design', 'planning'];
    const catBreakdown = categories.map(cat => {
      const catTasks = allTasks.filter(t => t.category.toLowerCase() === cat);
      const done = catTasks.filter(t => t.completed).length;
      const total = catTasks.length;
      return {
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        Completed: done,
        Remaining: total - done,
      };
    });
    setCategoryData(catBreakdown.filter(c => c.Completed > 0 || c.Remaining > 0));

    // 3. Mood distribution
    const moodCounts = {};
    allJournals.forEach(j => {
      moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
    });

    const moods = ['happy', 'tired', 'motivated', 'stressed', 'sad'];
    const moodPieData = moods.map(m => ({
      name: m.charAt(0).toUpperCase() + m.slice(1),
      value: moodCounts[m] || 0
    })).filter(item => item.value > 0);
    setMoodData(moodPieData);

    // 4. Calculate general stats
    const totalScheduled = allTasks.length;
    const totalCompleted = allTasks.filter(t => t.completed).length;
    const avgCompletion = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    
    // Find dominant mood
    let dominant = 'motivated';
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = mood;
      }
    });

    setStats({
      totalCompleted,
      totalScheduled,
      avgCompletion,
      currentStreak: profile?.streak || 0,
      dominantMood: dominant,
    });
  };

  // Custom Colors
  const COLORS = {
    happy: '#4ade80',     // green
    tired: '#3b82f6',     // blue
    motivated: '#f59e0b', // amber
    stressed: '#ef4444',  // red
    sad: '#a855f7',       // purple
  };

  const pieColors = [
    '#f59e0b', // motivated
    '#3b82f6', // tired
    '#4ade80', // happy
    '#ef4444', // stressed
    '#a855f7', // sad
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      
      {/* HEADER */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="font-display font-extrabold text-2xl tracking-tight">Productivity Analytics</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
          Review long-term consistency metrics and journal mood trends.
        </p>
      </div>

      {/* 4 GRID STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Total Tasks completed */}
        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">Focus Blocks Completed</span>
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-indigoCalm-500" />
            <span className="text-2xl font-bold font-display">{stats.totalCompleted}</span>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-2">out of {stats.totalScheduled} total scheduled</span>
        </div>

        {/* Avg Completion rate */}
        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">Avg Completion Rate</span>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold font-display">{stats.avgCompletion}%</span>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-2">lifetime task completion index</span>
        </div>

        {/* Current streak */}
        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">Planning Streak</span>
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-dawn-500 fill-dawn-500" />
            <span className="text-2xl font-bold font-display">{stats.currentStreak} Days</span>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-2">consecutive bedtime schedules</span>
        </div>

        {/* Dominant Mood */}
        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">Dominant Mood</span>
          <div className="flex items-center gap-3">
            <Smile className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold font-display capitalize">{stats.dominantMood}</span>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-2">most logged reflection emotion</span>
        </div>

      </div>

      {/* GRAPH GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Productivity Trends */}
        <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
          <h3 className="font-display font-bold text-base mb-6 text-left">Daily Productivity Index (Past 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={taskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c76ee" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#7c76ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="#888888" tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: 'white' }}
                />
                <Area type="monotone" dataKey="Completion Rate" stroke="#7c76ee" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task category completion status */}
        <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
          <h3 className="font-display font-bold text-base mb-6 text-left">Category Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: 'white' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Completed" stackId="a" fill="#7c76ee" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Remaining" stackId="a" fill="#ffd6b8" radius={[4, 4, 0, 0]} className="dark:fill-[#2d304c]" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood Distribution Pie */}
        <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Left explanation */}
            <div className="text-left space-y-4">
              <h3 className="font-display font-bold text-base">Mood Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                This pie chart shows your emotional logs written during evening reflections. Understanding your mood distribution helps you identify triggers, prevent burnout, and optimize rest.
              </p>
              <div className="space-y-2 mt-4">
                {moodData.map((entry, index) => {
                  const moodKey = entry.name.toLowerCase();
                  const badgeColor = COLORS[moodKey] || '#888888';
                  return (
                    <div key={entry.name} className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: badgeColor }}></span>
                        <span className="text-slate-700 dark:text-slate-350">{entry.name}</span>
                      </div>
                      <span className="text-slate-400">{entry.value} logs</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right chart element */}
            <div className="h-64 flex justify-center items-center">
              {moodData.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light">No mood entries logged yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {moodData.map((entry, index) => {
                        const moodKey = entry.name.toLowerCase();
                        const cellColor = COLORS[moodKey] || pieColors[index % pieColors.length];
                        return <Cell key={`cell-${index}`} fill={cellColor} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsPage;
