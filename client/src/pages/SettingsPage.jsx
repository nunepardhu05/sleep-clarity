// SettingsPage.jsx - Profile Edit and Notification Targets Configuration
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockServices } from '../services/MockServices';
import { 
  User, Bell, Check, Clock, Trash2
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

  // Notification states
  const [notifMorning, setNotifMorning] = useState(() => {
    const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
    const cached = localStorage.getItem(`sleep_clarity_${uid}_notif_morning`);
    return cached !== null ? cached === 'true' : true;
  });
  const [notifUpcoming, setNotifUpcoming] = useState(() => {
    const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
    const cached = localStorage.getItem(`sleep_clarity_${uid}_notif_upcoming`);
    return cached !== null ? cached === 'true' : true;
  });
  const [notifPlanning, setNotifPlanning] = useState(() => {
    const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
    const cached = localStorage.getItem(`sleep_clarity_${uid}_notif_planning`);
    return cached !== null ? cached === 'true' : true;
  });
  const [notifJournal, setNotifJournal] = useState(() => {
    const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
    const cached = localStorage.getItem(`sleep_clarity_${uid}_notif_journal`);
    return cached !== null ? cached === 'true' : true;
  });
  const [savedNotifs, setSavedNotifs] = useState(false);

  const handleDeleteAccount = async () => {
    if (window.confirm("WARNING: Are you sure you want to permanently delete your account? This will erase all your tasks, reflections, settings, and delete your login credentials. This action cannot be undone.")) {
      try {
        // Delete from backend database
        await MockServices.deleteAccount();
        
        // Delete from Firebase Auth
        if (user && typeof user.delete === 'function') {
          await user.delete();
        }
        
        // Reset all local cache data
        MockServices.resetAllData();
        
        // Log out and redirect
        await logout();
        navigate('/');
      } catch (err) {
        console.error("Account delete error:", err);
        alert(err.message || "Failed to delete account. For security reasons, you may need to sign out and sign in again before deleting your account.");
      }
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!name.trim() || !goal.trim()) return;

    updateProfile({ name, sleepTime, wakeTime, goal });
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  const handleNotificationSave = (e) => {
    e.preventDefault();
    const uid = localStorage.getItem('sleep_clarity_current_uid') || 'guest';
    localStorage.setItem(`sleep_clarity_${uid}_notif_morning`, notifMorning);
    localStorage.setItem(`sleep_clarity_${uid}_notif_upcoming`, notifUpcoming);
    localStorage.setItem(`sleep_clarity_${uid}_notif_planning`, notifPlanning);
    localStorage.setItem(`sleep_clarity_${uid}_notif_journal`, notifJournal);
    setSavedNotifs(true);
    setTimeout(() => setSavedNotifs(false), 2000);
  };

  // Browser Notification Test Trigger
  const triggerNotificationTest = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      fireTestNotification();
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        fireTestNotification();
      }
    } else {
      alert("Notification permissions have been denied. Enable them in your browser settings to test.");
    }
  };

  const fireTestNotification = () => {
    new Notification("Clarity Companion 🌙", {
      body: `Hey ${name || 'there'}! Your sleep time is ${sleepTime}. Let's take 3 minutes to plan tomorrow's tasks before you turn in.`,
      icon: "/src/favicon.svg"
    });
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
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                <input
                  type="text"
                  disabled
                  value={profile?.phone || 'Mock Account'}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-400 focus:outline-hidden"
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

        {/* 2. NOTIFICATIONS PREFERENCES */}
        <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-dawn-500" />
              <h3 className="font-display font-bold text-base">{t('notifications')}</h3>
            </div>
            
            <button
              onClick={triggerNotificationTest}
              className="px-3 py-1.5 bg-indigoCalm-500/10 text-indigoCalm-600 dark:text-indigoCalm-400 rounded-xl text-xs font-bold border border-indigoCalm-500/20 hover:bg-indigoCalm-500/15 transition-colors"
            >
              Test Notification Send
            </button>
          </div>

          <form onSubmit={handleNotificationSave} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-100/50 dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs font-semibold block">Morning Review Prompt</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Alerts you at wake time to inspect your planned list</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifMorning} 
                  onChange={(e) => setNotifMorning(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-indigoCalm-600 focus:ring-indigoCalm-500" 
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-100/50 dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs font-semibold block">{t('upcomingWarning')}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Fires 15 minutes before task schedule start times</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifUpcoming} 
                  onChange={(e) => setNotifUpcoming(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-indigoCalm-600 focus:ring-indigoCalm-500" 
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-100/50 dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs font-semibold block">{t('preSleepReminder')}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Reminds you 90 minutes before bed to organize tomorrow</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifPlanning} 
                  onChange={(e) => setNotifPlanning(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-indigoCalm-600 focus:ring-indigoCalm-500" 
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-100/50 dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs font-semibold block">{t('preBedPrompt')}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Reminds you 30 minutes before sleep to clear your head</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifJournal} 
                  onChange={(e) => setNotifJournal(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-indigoCalm-600 focus:ring-indigoCalm-500" 
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Save Alert Settings
              </button>
              {savedNotifs && (
                <span className="text-xs text-green-500 flex items-center gap-1 font-semibold">
                  <Check className="w-4 h-4" /> Alarms Saved
                </span>
              )}
            </div>
          </form>
        </div>

        {/* 3. DELETE ACCOUNT */}
        <div className="glass rounded-3xl p-6 border border-red-500/25 dark:border-red-500/15 bg-red-500/5 dark:bg-red-500/5">
          <div className="flex items-center gap-2.5 mb-4">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h3 className="font-display font-bold text-base text-red-600 dark:text-red-400">Delete Account</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-light leading-relaxed">
            Permanently delete your account and all associated user data, including tasks, reflections, and planning targets. This action is irreversible and will delete your credentials.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Delete My Account Permanently
          </button>
        </div>

      </div>

    </div>
  );
};

export default SettingsPage;
