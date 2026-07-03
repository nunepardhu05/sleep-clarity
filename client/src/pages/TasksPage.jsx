// TasksPage.jsx - Detailed Day Planner and Hourly Visual Timeline
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockServices } from '../services/MockServices';
import { 
  Plus, Trash2, CheckCircle2, Circle, Clock, Tag, AlertTriangle, 
  ChevronRight, Calendar, Sparkles, AlertCircle
} from 'lucide-react';

const TasksPage = () => {
  const { profile } = useAuth();

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
  
  const [activeTab, setActiveTab] = useState('tomorrow'); // today or tomorrow (default tomorrow for pre-sleep planning)
  const [tasks, setTasks] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 12-hour dropdown states
  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('00');
  const [endPeriod, setEndPeriod] = useState('AM');

  const convert12To24 = (h, m, p) => {
    if (!h) return '';
    let hour = parseInt(h);
    if (p === 'PM' && hour < 12) hour += 12;
    if (p === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${m || '00'}`;
  };

  const convert24To12 = (time24) => {
    if (!time24) return { hour: '', minute: '00', period: 'AM' };
    const [h, m] = time24.split(':');
    let hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return { hour: hour.toString(), minute: m, period };
  };

  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('work');
  const [editingTask, setEditingTask] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = () => {
    const targetDate = activeTab === 'today' ? todayStr : tomorrowStr;
    const list = MockServices.getTasksByDate(targetDate);
    // Sort tasks chronologically by start time
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setTasks(list);

    // Load AI tips for this date
    const tips = MockServices.getAIPlanSuggestions(targetDate);
    setAiSuggestions(tips);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetDate = activeTab === 'today' ? todayStr : tomorrowStr;
    const finalStart = convert12To24(startHour, startMin, startPeriod);
    const finalEnd = convert12To24(endHour, endMin, endPeriod);

    if (editingTask) {
      // Update existing
      MockServices.updateTask({
        ...editingTask,
        title,
        description,
        startTime: finalStart,
        endTime: finalEnd,
        priority,
        category,
      });
      setEditingTask(null);
    } else {
      // Create new
      MockServices.addTask({
        title,
        description,
        date: targetDate,
        startTime: finalStart,
        endTime: finalEnd,
        priority,
        category,
      });
    }

    // Reset form
    setTitle('');
    setDescription('');
    setStartHour('');
    setStartMin('00');
    setStartPeriod('AM');
    setEndHour('');
    setEndMin('00');
    setEndPeriod('AM');
    setPriority('medium');
    setCategory('work');
    setShowAddForm(false);
    loadTasks();
  };

  const handleDeleteTask = (id) => {
    MockServices.deleteTask(id);
    loadTasks();
  };

  const handleToggleTask = (id) => {
    MockServices.toggleTaskCompleted(id);
    loadTasks();
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    
    const s = convert24To12(task.startTime);
    setStartHour(s.hour);
    setStartMin(s.minute);
    setStartPeriod(s.period);
    
    const e = convert24To12(task.endTime);
    setEndHour(e.hour);
    setEndMin(e.minute);
    setEndPeriod(e.period);

    setPriority(task.priority);
    setCategory(task.category);
    setShowAddForm(true);
  };

  // Helper to determine background colors for categories
  const getCategoryColor = (cat) => {
    switch (cat.toLowerCase()) {
      case 'work': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'coding': return 'bg-indigoCalm-500/10 text-indigoCalm-500 border-indigoCalm-500/20';
      case 'learning': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'health': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'design': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  // Visual hourly timeline calculation
  const getTimelineHours = () => {
    const hours = [];
    const sleepHour = parseInt((profile?.sleepTime || '23:00').split(':')[0]);
    const wakeHour = parseInt((profile?.wakeTime || '07:00').split(':')[0]);
    
    // Fill from wake hour to sleep hour
    for (let h = wakeHour; h <= sleepHour; h++) {
      const displayHour = h.toString().padStart(2, '0') + ':00';
      hours.push(displayHour);
    }
    return hours;
  };

  const timelineHours = getTimelineHours();

  // Find tasks mapping to an hour block
  const getTaskForHour = (hourStr) => {
    const hrVal = parseInt(hourStr.split(':')[0]);
    
    return tasks.find(t => {
      if (!t.startTime || !t.endTime) return false;
      const startHr = parseInt(t.startTime.split(':')[0]);
      const endHr = parseInt(t.endTime.split(':')[0]);
      return hrVal >= startHr && hrVal < endHr;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl tracking-tight">Focus Planner</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
            Plan tomorrow's day completely before sleep to free up mental clarity tonight.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'today' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
          >
            Today's Plan
          </button>
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'tomorrow' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
          >
            Tomorrow's Plan (Bedtime)
          </button>
        </div>
      </div>

      {/* AI PLAN FEEDBACK WARNING BARS */}
      {aiSuggestions.length > 0 && (
        <div className="p-4 bg-indigoCalm-500/5 dark:bg-indigoCalm-500/5 border border-indigoCalm-500/15 rounded-2xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-dawn-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Bedtime Planner Feedback</span>
            {aiSuggestions.map((tip, idx) => (
              <p key={idx} className="text-xs text-slate-500 dark:text-slate-300 italic font-medium leading-relaxed">
                "{tip}"
              </p>
            ))}
          </div>
        </div>
      )}

      {/* GRID CONTENT: LIST & FORM VS VISUAL TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: TASK LIST & ADD PANEL (7/12 span) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Add / Edit Task Form toggle */}
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg">
              {activeTab === 'today' ? 'Today\'s Task List' : 'Tomorrow\'s Scheduled Tasks'}
            </h3>
            <button
              onClick={() => {
                setEditingTask(null);
                setShowAddForm(!showAddForm);
              }}
              className="px-3.5 py-1.5 bg-indigoCalm-600 hover:bg-indigoCalm-750 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? 'Cancel' : 'Add Task'}
            </button>
          </div>

          {/* TASK FORM CONTENT */}
          {showAddForm && (
            <form onSubmit={handleCreateTask} className="glass p-6 rounded-2xl border border-indigoCalm-500/20 dark:border-slate-800 space-y-4 page-fade-in text-left">
              <h4 className="font-display font-bold text-sm text-indigoCalm-600 dark:text-indigoCalm-400">
                {editingTask ? 'Edit Scheduled Task' : 'Schedule New Bedtime Task'}
              </h4>

              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Refactor auth state logic..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-hidden"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    placeholder="Outline specifics of what you need to cover..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-hidden"
                  />
                </div>

                {/* Timing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Start Time (Optional)</label>
                    <div className="flex gap-1.5">
                      <select
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="flex-1 px-2 py-2 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold focus:outline-hidden"
                      >
                        <option value="">Hour</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      
                      <select
                        value={startMin}
                        disabled={!startHour}
                        onChange={(e) => setStartMin(e.target.value)}
                        className="flex-1 px-2 py-2 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold focus:outline-hidden disabled:opacity-40"
                      >
                        {Array.from({ length: 12 }, (_, i) => i * 5).map(m => {
                          const val = m.toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                      
                      <select
                        value={startPeriod}
                        disabled={!startHour}
                        onChange={(e) => setStartPeriod(e.target.value)}
                        className="px-2 py-2 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold focus:outline-hidden disabled:opacity-40"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">End Time (Optional)</label>
                    <div className="flex gap-1.5">
                      <select
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="flex-1 px-2 py-2 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold focus:outline-hidden"
                      >
                        <option value="">Hour</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      
                      <select
                        value={endMin}
                        disabled={!endHour}
                        onChange={(e) => setEndMin(e.target.value)}
                        className="flex-1 px-2 py-2 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold focus:outline-hidden disabled:opacity-40"
                      >
                        {Array.from({ length: 12 }, (_, i) => i * 5).map(m => {
                          const val = m.toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                      
                      <select
                        value={endPeriod}
                        disabled={!endHour}
                        onChange={(e) => setEndPeriod(e.target.value)}
                        className="px-2 py-2 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold focus:outline-hidden disabled:opacity-40"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Priority & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-55 dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="work">Work</option>
                      <option value="coding">Coding</option>
                      <option value="learning">Learning</option>
                      <option value="health">Health</option>
                      <option value="design">Design</option>
                      <option value="planning">Planning</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigoCalm-600 hover:bg-indigoCalm-750 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {editingTask ? 'Save Task Edit' : 'Schedule Focus block'}
              </button>
            </form>
          )}

          {/* TASK ITERABLE LIST */}
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800/80">
                <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-light text-slate-400 dark:text-slate-500">
                  {activeTab === 'today' ? 'Your schedule is currently empty today.' : 'Take 2 minutes to plan tomorrow’s focus before sleeping.'}
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`
                    glass rounded-2xl p-4 border transition-all duration-200 flex justify-between items-start gap-4
                    ${task.completed 
                      ? 'border-slate-200 dark:border-slate-850 opacity-60' 
                      : 'border-slate-200 dark:border-slate-800/80 hover:border-indigoCalm-500/20 shadow-xs'}
                  `}
                >
                  <div className="flex gap-3.5 items-start min-w-0">
                    <button 
                      onClick={() => handleToggleTask(task.id)}
                      className="text-indigoCalm-500 hover:scale-105 transition-transform mt-0.5 flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-indigoCalm-500 fill-indigoCalm-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className={`text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed ${task.completed ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3.5">
                        {task.startTime && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" />
                            {formatTimeTo12Hour(task.startTime)} - {formatTimeTo12Hour(task.endTime)}
                          </span>
                        )}
                        
                        <span className={`text-[9px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>

                        <span className={`
                          text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider
                          ${task.priority === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
                          ${task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : ''}
                          ${task.priority === 'low' ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : ''}
                        `}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEditClick(task)}
                      className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Task"
                    >
                      <Clock className="w-4 h-4 text-indigoCalm-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: VISUAL HOURLY TIMELINE (5/12 span) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg">Hourly Timeline</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Wake to Sleep</span>
            </div>

            <div className="space-y-2 border-l-2 border-slate-250 dark:border-slate-800 pl-4 py-2 max-h-[500px] overflow-y-auto pr-1">
              {timelineHours.map((hour) => {
                const mappedTask = getTaskForHour(hour);
                
                return (
                  <div key={hour} className="flex gap-4 items-start min-h-[56px] relative group">
                    {/* Hour Marker */}
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 w-10 flex-shrink-0 pt-1">
                      {formatTimeTo12Hour(hour)}
                    </span>

                    {/* Timeline Node dot */}
                    <div className="absolute left-[-21px] top-2.5 w-2.5 h-2.5 rounded-full bg-slate-350 dark:bg-slate-800 group-hover:bg-indigoCalm-500 transition-colors"></div>

                    {/* Task Display Box */}
                    {mappedTask ? (
                      <div className={`
                        flex-1 p-3 rounded-xl border leading-relaxed cursor-pointer hover:scale-[1.01] transition-transform
                        ${mappedTask.completed 
                          ? 'bg-slate-100/40 dark:bg-slate-800/25 border-slate-200 dark:border-slate-850 opacity-60' 
                          : 'bg-indigoCalm-500/5 border-indigoCalm-500/20 dark:border-indigoCalm-500/20'}
                      `}>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-indigoCalm-600 dark:text-indigoCalm-400 font-bold uppercase tracking-wider">
                            {formatTimeTo12Hour(mappedTask.startTime)} - {formatTimeTo12Hour(mappedTask.endTime)}
                          </span>
                          <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${getCategoryColor(mappedTask.category)}`}>
                            {mappedTask.category}
                          </span>
                        </div>
                        <p className={`text-xs font-bold mt-1 text-slate-800 dark:text-slate-200 truncate ${mappedTask.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {mappedTask.title}
                        </p>
                      </div>
                    ) : (
                      // Empty hour block placeholder
                      <div className="flex-1 py-3 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl px-3 flex items-center justify-between opacity-40 hover:opacity-100 hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-light">Free Window</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">No tasks</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TasksPage;
