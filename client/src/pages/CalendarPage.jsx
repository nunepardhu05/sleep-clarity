// CalendarPage.jsx - Event Calendar, Task Marker, and Notification Alerts
import React, { useState, useEffect } from 'react';
import { MockServices } from '../services/MockServices';
import { useLanguage } from '../context/LanguageContext';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalIcon,
  Trash2, AlertCircle, BookOpen, Smile, Sparkles, Check
} from 'lucide-react';

const CalendarPage = () => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('00');
  const [endPeriod, setEndPeriod] = useState('AM');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('work');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadAllTasks();
  }, []);

  const loadAllTasks = () => {
    const list = MockServices.getTasks();
    setTasks(list);
  };

  // Convert time values
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

  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minStr} ${ampm}`;
  };

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Grid math
  const getDaysInMonth = (d) => {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (d) => {
    return new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar cells (previous month overlap, current month, next month overlap)
  const calendarCells = [];
  const prevMonthDate = new Date(year, month - 1, 1);
  const daysInPrevMonth = getDaysInMonth(prevMonthDate);

  // Pad previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = `${year}-${(month === 0 ? 12 : month).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    calendarCells.push({ day, currentMonth: false, dateStr });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    calendarCells.push({ day, currentMonth: true, dateStr });
  }

  // Pad next month days to complete grid rows
  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const dateStr = `${year}-${(month + 2 === 13 ? 1 : month + 2).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    calendarCells.push({ day, currentMonth: false, dateStr });
  }

  // Get tasks for selected date
  const selectedDateTasks = tasks.filter(t => t.date === selectedDateStr);

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalStart = convert12To24(startHour, startMin, startPeriod);
    const finalEnd = convert12To24(endHour, endMin, endPeriod);

    MockServices.addTask({
      title,
      description: description || 'Scheduled Calendar Event',
      date: selectedDateStr,
      startTime: finalStart,
      endTime: finalEnd,
      priority,
      category,
    });

    // Reset Form
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
    loadAllTasks();
  };

  const handleToggleTask = (id) => {
    MockServices.toggleTaskCompleted(id);
    loadAllTasks();
  };

  const handleDeleteTask = (id) => {
    MockServices.deleteTask(id);
    loadAllTasks();
  };

  // Helper colors
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

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 text-left">
        <h2 className="font-display font-extrabold text-2xl tracking-tight">{t('navCalendar')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
          {t('calendarSub')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* CALENDAR COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
            {/* Header controls */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-200">
                {monthsList[month]} {year}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl transition-all"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center font-display font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {daysOfWeek.map(d => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                const cellTasks = tasks.filter(t => t.date === cell.dateStr);
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
                
                // Categorize priority colors of dots
                const hasHigh = cellTasks.some(t => t.priority === 'high');
                const hasMed = cellTasks.some(t => t.priority === 'medium');
                const hasLow = cellTasks.some(t => t.priority === 'low');

                return (
                  <button
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`
                      aspect-square rounded-2xl p-2.5 flex flex-col justify-between relative transition-all border text-left
                      ${cell.currentMonth 
                        ? 'bg-white dark:bg-[#12162a]/45 hover:border-slate-350 dark:hover:border-slate-700' 
                        : 'bg-slate-100/50 dark:bg-[#0b0c16]/30 opacity-45'}
                      ${isSelected 
                        ? 'border-indigoCalm-500 ring-2 ring-indigoCalm-500/20 shadow-md scale-102 font-bold' 
                        : 'border-slate-200/60 dark:border-slate-850'}
                    `}
                  >
                    {/* Day number */}
                    <span className={`
                      text-xs font-semibold
                      ${isToday && cell.currentMonth ? 'text-indigoCalm-600 dark:text-indigoCalm-400 font-extrabold underline decoration-2 decoration-indigoCalm-500' : 'text-slate-700 dark:text-slate-300'}
                    `}>
                      {cell.day}
                    </span>

                    {/* Task Priority Indicator Dots */}
                    {cellTasks.length > 0 && (
                      <div className="flex gap-1 mt-auto">
                        {hasHigh && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="High priority"></span>}
                        {hasMed && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Medium priority"></span>}
                        {hasLow && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" title="Low priority"></span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* EVENTS LIST & EVENT BUILDER PANEL (5/12 span) */}
        <div className="lg:col-span-5 space-y-6">
          {/* List section */}
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-200">
                  {t('eventsOn')} {new Date(selectedDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">ALERTS INTEGRATED</span>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-2 bg-indigoCalm-600 hover:bg-indigoCalm-750 text-white rounded-xl transition-all shadow-md shadow-indigoCalm-600/10 flex items-center justify-center gap-1.5 text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> {t('addTask')}
              </button>
            </div>

            {/* Dynamic event scheduler form */}
            {showAddForm && (
              <form onSubmit={handleCreateEvent} className="p-4 bg-slate-50 dark:bg-[#12162a]/60 border border-slate-200 dark:border-slate-850 rounded-2xl mb-5 space-y-4 page-fade-in text-left">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('title')}</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Dentist appointment..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('description')}</label>
                  <input
                    type="text"
                    placeholder="Short description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                {/* 12-Hour Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('startTime')}</label>
                    <div className="flex gap-1">
                      <select
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="flex-1 px-2 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold focus:outline-hidden"
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
                        className="flex-1 px-2 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold focus:outline-hidden disabled:opacity-40"
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
                        className="px-1.5 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold focus:outline-hidden disabled:opacity-40"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('endTime')}</label>
                    <div className="flex gap-1">
                      <select
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="flex-1 px-2 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold focus:outline-hidden"
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
                        className="flex-1 px-2 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold focus:outline-hidden disabled:opacity-40"
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
                        className="px-1.5 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold focus:outline-hidden disabled:opacity-40"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Priority & Category */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('priority')}</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="high">{t('high')}</option>
                      <option value="medium">{t('medium')}</option>
                      <option value="low">{t('low')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('category')}</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-[#111326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="work">Work</option>
                      <option value="coding">Coding</option>
                      <option value="learning">Learning</option>
                      <option value="health">Health</option>
                      <option value="design">Design</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigoCalm-600 hover:bg-indigoCalm-750 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigoCalm-600/10"
                  >
                    {t('setAlert')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}

            {/* List entries */}
            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {selectedDateTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 opacity-60">
                  <CalIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-light">{t('noEvents')}</p>
                </div>
              ) : (
                selectedDateTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3.5 border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-[#12162a]/30 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex gap-3 text-left">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5"
                      >
                        {task.completed ? (
                          <span className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500 flex items-center justify-center text-green-500">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 block"></span>
                        )}
                      </button>

                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold leading-relaxed truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-light mt-0.5 leading-relaxed">
                          {task.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {task.startTime && (
                            <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatTimeTo12Hour(task.startTime)} - {formatTimeTo12Hour(task.endTime)}
                            </span>
                          )}
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </span>
                          {task.startTime && !task.completed && (
                            <span className="text-[8px] bg-dawn-500/10 text-dawn-600 dark:text-dawn-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                              🔔 Alert Enabled (15m prior)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-all flex-shrink-0"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
