// LandingPage.jsx - Stunning Hero Welcome Page
import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Star, Calendar, MessageSquare, ShieldCheck, ArrowRight, Flame } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080a14] text-slate-800 dark:text-slate-100 flex flex-col relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative stars and lighting */}
      <div className="absolute top-1/4 left-1/10 w-2 h-2 rounded-full bg-white opacity-40 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-white opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-white opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigoCalm-500/10 dark:bg-indigoCalm-900/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-dawn-500/5 dark:bg-dawn-900/10 blur-[100px] pointer-events-none"></div>

      {/* Landing Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigoCalm-600 flex items-center justify-center text-white shadow-lg">
            <Moon className="w-5 h-5 fill-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Sleep Clarity</span>
        </div>

        <Link 
          to="/login?mode=signin"
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 max-w-5xl mx-auto text-center py-16 relative z-10">
        
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigoCalm-500/10 dark:bg-indigoCalm-500/15 border border-indigoCalm-500/20 text-indigoCalm-600 dark:text-indigoCalm-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse-subtle">
          <Flame className="w-4 h-4 text-dawn-500 fill-dawn-500" />
          AI-Powered Bedtime Planning
        </div>

        {/* Hero title */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight leading-[1.1] mb-6 max-w-4xl">
          Sleep with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigoCalm-600 to-indigoCalm-400 dark:from-indigoCalm-400 dark:to-dawn-400">clarity</span>.<br />
          Wake with <span className="text-transparent bg-clip-text bg-gradient-to-r from-dawn-600 to-dawn-400 dark:from-dawn-400 dark:to-indigoCalm-400">purpose</span>.
        </h1>

        {/* Hero description */}
        <p className="text-slate-500 dark:text-slate-400 text-base sm:text-xl max-w-2xl mb-10 leading-relaxed font-light">
          Worrying about tomorrow ruins tonight's sleep. Plan your tasks, journal your thoughts, and organize your schedule to help you declutter before bed.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
          <Link
            to="/login?mode=signup"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigoCalm-600 hover:bg-indigoCalm-750 text-white rounded-2xl font-semibold shadow-lg shadow-indigoCalm-600/25 dark:shadow-indigoCalm-600/15 transition-all hover:scale-[1.02]"
          >
            Start Planning Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <a
            href="#features"
            className="px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
          >
            How it works
          </a>
        </div>

        {/* Visual Mockup Card */}
        <div className="w-full glass-premium rounded-3xl p-4 border border-slate-200 dark:border-slate-800/80 shadow-2xl relative">
          
          {/* Mock dashboard rendering */}
          <div className="bg-slate-50 dark:bg-[#0e1122] rounded-2xl p-6 text-left border border-slate-200 dark:border-slate-800/40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
              <div>
                <h3 className="font-display font-bold text-xl">Good evening, Alex</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Your sleep window starts in 45 minutes.</p>
              </div>
              <div className="flex gap-2.5">
                <span className="px-3 py-1 rounded-lg bg-dawn-500/10 text-dawn-500 border border-dawn-500/20 text-xs font-semibold">Streak: 5 Days</span>
                <span className="px-3 py-1 rounded-lg bg-indigoCalm-500/10 text-indigoCalm-500 border border-indigoCalm-500/20 text-xs font-semibold">100% Completed</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task list simulation */}
              <div className="space-y-3">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block uppercase tracking-wider">Tomorrow's Schedule</span>
                <div className="p-3 bg-white dark:bg-[#141930] rounded-xl border border-indigoCalm-500/20 dark:border-slate-800/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigoCalm-600 dark:text-indigoCalm-400 font-semibold uppercase">09:00 - 11:30</span>
                    <p className="text-sm font-semibold mt-0.5">Refactor state management in Client</p>
                  </div>
                  <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold">High</span>
                </div>
                <div className="p-3 bg-white dark:bg-[#141930] rounded-xl border border-slate-200 dark:border-slate-800/50 opacity-70 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">22:00 - 22:30</span>
                    <p className="text-sm font-semibold mt-0.5">Read atomic habits</p>
                  </div>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">Low</span>
                </div>
              </div>

              {/* Journal stats simulation */}
              <div className="bg-indigoCalm-500/5 border border-indigoCalm-500/10 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-dawn-500 fill-dawn-500" />
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Reflection Tracker</span>
                  </div>
                  <p className="text-sm italic text-slate-600 dark:text-indigoCalm-300 leading-relaxed font-medium">
                    "Journaling tonight completed! Keeping your mind clear and your sleep quality high is the first step to a productive tomorrow."
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 self-end mt-4">Active Streak</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-6 relative z-10">
        <h2 className="font-display font-bold text-3xl text-center mb-14 tracking-tight">Designed for Nocturnal Peace & Daily Focus</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigoCalm-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigoCalm-100 dark:bg-indigoCalm-950 flex items-center justify-center text-indigoCalm-600 dark:text-indigoCalm-400 mb-6">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-3">Pre-Bed Scheduling</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Manually write down tomorrow's tasks before you close your eyes. Offload the cognitive burden of organizing your morning so your brain can enter deep sleep.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigoCalm-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-dawn-500/10 flex items-center justify-center text-dawn-500 mb-6">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-3">Reflection Journaling</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Empty your thoughts and rate your mood. Log daily reflections to help process emotional blockages, leaving worries behind before sleep.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigoCalm-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-3">Progress Tracking</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Stay consistent with streak metrics and stats. Track your task completion rates over time and build a healthier sleep-wake routine.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 dark:border-slate-900 max-w-7xl mx-auto w-full px-6 text-xs text-slate-400 dark:text-slate-600 mt-auto">
        <p>© 2026 Sleep Clarity. Sleep with clarity, wake with purpose.</p>
      </footer>

    </div>
  );
};

export default LandingPage;
