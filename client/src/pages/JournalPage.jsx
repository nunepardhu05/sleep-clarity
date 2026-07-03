// JournalPage.jsx - Pre-sleep Reflection, Mood check, and AI Tone Analyst
import React, { useState, useEffect } from 'react';
import { MockServices } from '../services/MockServices';
import { useLanguage } from '../context/LanguageContext';
import { 
  Smile, Frown, Coffee, Zap, AlertTriangle, Sparkles, 
  Calendar, Check, ChevronDown, ChevronUp, BookOpen, Clock, Download
} from 'lucide-react';

const JournalPage = () => {
  const { t } = useLanguage();
  const todayStr = new Date().toISOString().split('T')[0];

  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('motivated');
  const [journals, setJournals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedJournal, setExpandedJournal] = useState(null);

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = () => {
    const list = MockServices.getJournals();
    // Sort journals by date descending
    list.sort((a, b) => b.date.localeCompare(a.date));
    setJournals(list);

    // Check if journaled today, load it in the editor
    const todayJournal = list.find(j => j.date === todayStr);
    if (todayJournal) {
      setContent(todayJournal.content);
      setSelectedMood(todayJournal.mood);
    }
  };

  const handleJournalSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    
    // Save daily entry
    setTimeout(() => {
      MockServices.addJournalEntry(content, selectedMood);
      setSaving(false);
      loadJournals();
    }, 500);
  };

  const downloadSingleJournal = (journal) => {
    const dateFormatted = new Date(journal.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const fileContent = `Sleep Clarity Reflection\nDate: ${dateFormatted}\nMood: ${journal.mood.toUpperCase()}\n==========================================\n\nReflection Entry:\n${journal.content}\n`;
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reflection_${journal.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllJournals = () => {
    if (journals.length === 0) return;
    let fileContent = `Sleep Clarity Reflection Journals - Full Export\nExport Date: ${new Date().toLocaleDateString()}\n==========================================\n\n`;
    
    journals.forEach((j) => {
      const dateFormatted = new Date(j.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      fileContent += `Date: ${dateFormatted}\nMood: ${j.mood.toUpperCase()}\n------------------------------------------\n${j.content}\n\n==========================================\n\n`;
    });
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sleep_clarity_all_reflections.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleExpandJournal = (id) => {
    setExpandedJournal(prev => prev === id ? null : id);
  };

  const moods = [
    { name: 'happy', emoji: '😊', label: 'Happy', color: 'border-green-500 text-green-500 bg-green-500/10' },
    { name: 'tired', emoji: '🥱', label: 'Tired', color: 'border-blue-500 text-blue-500 bg-blue-500/10' },
    { name: 'motivated', emoji: '⚡', label: 'Motivated', color: 'border-amber-500 text-amber-500 bg-amber-500/10' },
    { name: 'stressed', emoji: '🥵', label: 'Stressed', color: 'border-red-500 text-red-500 bg-red-500/10' },
    { name: 'sad', emoji: '😔', label: 'Sad', color: 'border-purple-500 text-purple-500 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      
      {/* HEADER */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="font-display font-extrabold text-2xl tracking-tight">{t('navJournal')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
          {t('journalSub')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: JOURNAL CREATOR & AI OUTPUT (7/12 span) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
            <h3 className="font-display font-bold text-lg mb-1">{t('journalHeader')}</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 block mb-6">{t('journalSub')}</span>

            <form onSubmit={handleJournalSubmit} className="space-y-6 text-left">
              {/* Mood Selector cards */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">How do you feel right now?</label>
                <div className="grid grid-cols-5 gap-2.5">
                  {moods.map((m) => {
                    const isSelected = selectedMood === m.name;
                    return (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => setSelectedMood(m.name)}
                        className={`
                          p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all
                          ${isSelected 
                            ? `${m.color} ring-2 ring-indigoCalm-500/20 scale-102 font-bold` 
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12162a] text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'}
                        `}
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-[9px] uppercase tracking-wider hidden sm:block">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reflection log */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Write your journal entry</label>
                <textarea
                  required
                  placeholder="It was a busy day today. We launched the draft layouts. I worked 4 hours straight on React code without a break and felt a bit worn out around 4 PM, but..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-750 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving Reflection...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    {t('saveEntry')}
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: CALENDAR LOG HISTORY (5/12 span) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 text-left">
            <div className="flex justify-between items-center mb-4 gap-2">
              <h3 className="font-display font-bold text-base">{t('journalHistory')}</h3>
              {journals.length > 0 && (
                <button
                  onClick={downloadAllJournals}
                  className="text-[10px] px-2.5 py-1.5 bg-indigoCalm-500/10 hover:bg-indigoCalm-500/20 text-indigoCalm-600 dark:text-indigoCalm-400 border border-indigoCalm-500/20 rounded-lg font-bold transition-all flex items-center gap-1 flex-shrink-0"
                >
                  <Download className="w-3 h-3" /> {t('downloadAll')}
                </button>
              )}
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {journals.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <p className="text-xs font-light text-slate-400 dark:text-slate-500">{t('noEntries')}</p>
                </div>
              ) : (
                journals.map((j) => {
                  const isExpanded = expandedJournal === j.id;
                  const itemMood = moods.find(m => m.name === j.mood);
                  
                  return (
                    <div 
                      key={j.id} 
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#12162a] transition-all"
                    >
                      {/* Header toggle bar */}
                      <div 
                        onClick={() => toggleExpandJournal(j.id)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/20"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="text-lg bg-slate-100 dark:bg-slate-800 w-8 h-8 rounded-lg flex items-center justify-center">
                            {itemMood?.emoji || '📝'}
                          </span>
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
                              {new Date(j.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
                              Mood: {j.mood}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>

                      {/* Expandable content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-850 pt-3 space-y-3 text-left bg-slate-50/50 dark:bg-[#0e1122]">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Your Entry</span>
                            <button
                              onClick={() => downloadSingleJournal(j)}
                              className="text-[10px] text-indigoCalm-600 dark:text-indigoCalm-400 hover:underline font-semibold flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> {t('downloadJSON')}
                            </button>
                          </div>
                          
                          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-light whitespace-pre-wrap">
                            {j.content}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default JournalPage;
