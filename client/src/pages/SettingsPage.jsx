// SettingsPage.jsx - Profile Edit and Notification Targets Configuration
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockServices } from '../services/MockServices';
import { 
  User, Check, Clock
} from 'lucide-react';

const SettingsPage = () => {
  const { user, logout, profile, updateProfile } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.name || '');
  const [sleepTime, setSleepTime] = useState(profile?.sleepTime || '23:00');
  const [wakeTime, setWakeTime] = useState(profile?.wakeTime || '07:00');
  const [goal, setGoal] = useState(profile?.goal || '');
  const [savedProfile, setSavedProfile] = useState(false);
  const [error, setError] = useState('');

  const handleProfileSave = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !goal.trim()) return;

    // Validate 6-hour sleep target difference
    const getSleepDurationInHours = (sleep, wake) => {
      const [sleepH, sleepM] = sleep.split(':').map(Number);
      const [wakeH, wakeM] = wake.split(':').map(Number);
      let diff = (wakeH * 60 + wakeM) - (sleepH * 60 + sleepM);
      if (diff < 0) diff += 24 * 60;
      return diff / 60;
    };

    const duration = getSleepDurationInHours(sleepTime, wakeTime);
    if (duration < 6) {
      setError('Sleep target and wake target difference must be at least 6 hours.');
      return;
    }

    updateProfile({ name, sleepTime, wakeTime, goal });
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };



  return (
    <div className="space-y-8 max-w-4xl text-left">
      
      {/* HEADER */}
      <div className="border-b border-slate-205 dark:border-slate-800 pb-4">
        <h2 className="font-display font-extrabold text-2xl tracking-tight">{t('settingsHeader')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
          {t('settingsSub')}
        </p>
      </div>

      <div className="space-y-6">
        
        {/* 1. USER PROFILE TARGETS */}
        <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 mb-6">
            <User className="w-5 h-5 text-indigoCalm-600 dark:text-indigoCalm-400" />
            <h3 className="font-display font-bold text-base">{t('bedtimeProfile')}</h3>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold text-left">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('nameLabel')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'Guest Account'}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-450 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {t('sleepTarget')}
                </label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {t('wakeTarget')}
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('goalLabel')}</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-hidden"
              />
            </div>

            {/* Language Selection */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                🌐 {t('preferredLanguage')}
              </label>
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
              >
                <option value="en">🇺🇸 English</option>
                <option value="te">🇮🇳 తెలుగు (Telugu)</option>
                <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
                <option value="kn">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                <option value="ml">🇮🇳 മലയാളം (Malayalam)</option>
                <option value="mr">🇮🇳 मराठी (Marathi)</option>
                <option value="es">🇪🇸 Español (Spanish)</option>
                <option value="fr">🇫🇷 Français (French)</option>
                <option value="de">🇩🇪 Deutsch (German)</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                {t('saveSettings')}
              </button>
              {savedProfile && (
                <span className="text-xs text-green-500 flex items-center gap-1 font-semibold">
                  <Check className="w-4 h-4" /> {t('settingsSaved')}
                </span>
              )}
            </div>
          </form>
        </div>



      </div>

    </div>
  );
};

export default SettingsPage;
