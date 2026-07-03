import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MockServices } from '../services/MockServices';
import { Moon, Shield, ArrowRight, Smartphone, Clock, Sparkles, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { user, profile, sendOTP, loginWithEmail, registerWithEmail, onboardUser, isMockMode, sendVerificationEmail, reloadUser, logout, updateUserPassword, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('email'); // email, setup, verify
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Monitor query params to sync Sign In / Sign Up modes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
      setEmailStage('email');
    } else if (mode === 'signin') {
      setIsSignUp(false);
      setEmailStage('email');
    }
  }, [location.search]);

  // Setup form states
  const [name, setName] = useState('');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [goal, setGoal] = useState('');

  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailStage, setEmailStage] = useState('email'); // email, password
  const [showPassword, setShowPassword] = useState(false);

  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: 'Weak', color: 'text-slate-400', barColor: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;

    const mapping = [
      { score: 0, text: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' },
      { score: 1, text: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' },
      { score: 2, text: 'Fair', color: 'text-amber-500', barColor: 'bg-amber-500' },
      { score: 3, text: 'Good', color: 'text-indigoCalm-500', barColor: 'bg-indigoCalm-500' },
      { score: 4, text: 'Strong', color: 'text-green-500', barColor: 'bg-green-500' },
    ];
    return mapping[score] || mapping[0];
  };

  const strength = getPasswordStrength();

  // Automatically check authentication redirection on state updates
  useEffect(() => {
    if (user) {
      if (user.email && !user.emailVerified) {
        setStep('verify');
      } else {
        const profileData = MockServices.getProfile();
        if (profileData && profileData.name) {
          navigate('/dashboard');
        } else {
          setStep('setup');
        }
      }
    }
  }, [user]);

  // Automatic Email Verification Polling (checks every 3 seconds)
  useEffect(() => {
    let interval = null;
    if (step === 'verify' && user) {
      interval = setInterval(async () => {
        try {
          const refreshedUser = await reloadUser();
          if (refreshedUser && refreshedUser.emailVerified) {
            const profileData = MockServices.getProfile();
            if (profileData && profileData.name) {
              navigate('/dashboard');
            } else {
              setStep('setup');
            }
          }
        } catch (err) {
          console.error("Auto verification check failed:", err);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, user]);

  // Cooldown countdown timer
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleCheckVerification = async () => {
    setError('');
    setLoading(true);
    try {
      const refreshedUser = await reloadUser();
      if (refreshedUser && refreshedUser.emailVerified) {
        const profileData = MockServices.getProfile();
        if (profileData && profileData.name) {
          navigate('/dashboard');
        } else {
          setStep('setup');
        }
      } else {
        setError('Your email is not verified yet. Please click the link in your email and click this button again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to check verification. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await sendVerificationEmail();
      setError('Verification email has been resent to your inbox.');
      setResendCooldown(60); // 60 seconds cooldown timer
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please go back and enter your email address first.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordReset(email);
      setError(`A password reset link has been sent to ${email}. Check your inbox/spam folder.`);
      alert(`Password reset link sent to ${email}! Click the link inside the email to choose a new password, then return here to sign in.`);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Submit (Two-step email/password verification)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (emailStage === 'email') {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      
      if (isSignUp) {
        // Sign up flow: generate a temporary password, register immediately to send verification link
        setLoading(true);
        try {
          const tempPass = `TempPass_${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}!`;
          localStorage.setItem('sleep_clarity_temp_register_pass', tempPass);
          await registerWithEmail(email, tempPass);
          setStep('verify');
        } catch (err) {
          setError(err.message || 'Registration failed. This email may already be in use.');
        } finally {
          setLoading(false);
        }
      } else {
        // Sign in flow: transition to password input stage
        setEmailStage('password');
      }
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        // Fallback or legacy setup
        await registerWithEmail(email, password);
        setStep('setup');
      } else {
        // Sign In: authenticate with the user's chosen password
        await loginWithEmail(email, password);
        
        const connectionMode = localStorage.getItem('sleep_clarity_connection_mode') || 'offline';
        if (connectionMode === 'fullstack') {
          await MockServices.syncFromBackend();
        }
        
        const profileData = MockServices.getProfile();
        
        if (profileData && profileData.name) {
          navigate('/dashboard');
        } else {
          setStep('setup');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Onboarding Profile Setup & Password Config
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    
    // Validate password selection
    if (!setupPassword) {
      setError('Please choose a password for your account.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    // Enforce strong password policy
    const hasLetter = /[a-zA-Z]/.test(setupPassword);
    const hasNumber = /[0-9]/.test(setupPassword);
    if (setupPassword.length < 8 || !hasLetter || !hasNumber) {
      setError('For security, passwords must be at least 8 characters long and contain both letters and numbers.');
      return;
    }
    
    if (!goal.trim()) {
      setError('Please write down at least one productivity goal.');
      return;
    }

    setLoading(true);
    try {
      // Update password in authentication service
      await updateUserPassword(setupPassword);
      
      // Complete profile onboarding
      onboardUser({ name, sleepTime, wakeTime, goal });
      
      localStorage.removeItem('sleep_clarity_temp_register_pass');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a14] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Back glow circles */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-indigoCalm-500/10 dark:bg-indigoCalm-900/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-dawn-500/5 dark:bg-dawn-900/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo Branding */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-indigoCalm-600 flex items-center justify-center text-white shadow-lg">
            <Moon className="w-5 h-5 fill-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">Sleep Clarity</span>
        </div>

        {/* Auth Box Container */}
        <div className="glass-premium rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
          
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* STEP 1: EMAIL PASSWORD INPUT */}
          {step === 'email' && (
            <div className="page-fade-in text-left">
              <h2 className="font-display font-bold text-xl mb-1.5">{isSignUp ? 'Create your Account' : 'Welcome Back'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {isSignUp ? 'Sign up with your email and password to begin planning.' : 'Sign in using your registered email and password.'}
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {emailStage === 'email' ? (
                  <div className="page-fade-in">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                    />
                  </div>
                ) : (
                  <div className="page-fade-in space-y-4">
                    {/* Google-like Account details badge */}
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[220px]">{email}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setEmailStage('email');
                          setPassword('');
                        }} 
                        className="text-[10px] font-bold text-indigoCalm-600 dark:text-indigoCalm-400 hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Password</label>
                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={loading}
                            className="text-[10px] font-bold text-indigoCalm-600 dark:text-indigoCalm-400 hover:underline"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="w-full pl-4 pr-12 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Strength Meter */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Password Strength</span>
                        <span className={strength.color}>{strength.text}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <div className={`h-1 rounded-full ${strength.score >= 1 ? strength.barColor : 'bg-slate-200 dark:bg-slate-850'}`}></div>
                        <div className={`h-1 rounded-full ${strength.score >= 2 ? strength.barColor : 'bg-slate-200 dark:bg-slate-850'}`}></div>
                        <div className={`h-1 rounded-full ${strength.score >= 3 ? strength.barColor : 'bg-slate-200 dark:bg-slate-850'}`}></div>
                        <div className={`h-1 rounded-full ${strength.score >= 4 ? strength.barColor : 'bg-slate-200 dark:bg-slate-850'}`}></div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : (emailStage === 'email' ? 'Next' : (isSignUp ? 'Sign Up' : 'Sign In'))}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {emailStage === 'email' ? (
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full text-center text-xs text-slate-400 dark:text-slate-500 font-medium hover:underline block mt-2"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStage('email');
                      setPassword('');
                    }}
                    className="w-full text-center text-xs text-slate-400 dark:text-slate-500 font-medium hover:underline block mt-2"
                  >
                    Back to Email step
                  </button>
                )}
              </form>
            </div>
          )}

          {/* STEP 3: FIRST-TIME PROFILE SETUP */}
          {step === 'setup' && (
            <div className="page-fade-in">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-5 h-5 text-dawn-500" />
                <h2 className="font-display font-bold text-xl">Onboarding Setup</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Welcome to the platform. Let's customize your nighttime buffers.
              </p>

              <form onSubmit={handleSetupSubmit} className="space-y-4 text-left">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    placeholder="Alex Developer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                  />
                </div>

                {/* Password Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">Choose Password</label>
                    <div className="relative">
                      <input
                        type={showSetupPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPassword(!showSetupPassword)}
                        className="absolute right-4 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
                      >
                        {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">Confirm Password</label>
                    <input
                      type={showSetupPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                    />
                  </div>
                </div>

                {/* Sleep & Wake Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Sleep Time
                    </label>
                    <input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Wake-up Time
                    </label>
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">Productivity Target</label>
                  <textarea
                    placeholder="e.g. Finish development tasks in the mornings, and read Atomic Habits before bed."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  Create My Profile
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: EMAIL VERIFICATION REQUIRED */}
          {step === 'verify' && (
            <div className="page-fade-in text-left">
              <h2 className="font-display font-bold text-xl mb-1.5">Verify your Email</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                We sent a verification link to <span className="font-semibold text-slate-700 dark:text-indigoCalm-400">{user?.email}</span>. Please click the link inside your email (inbox or spam) to verify your account.
              </p>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-xl font-medium mb-5 leading-relaxed flex gap-2.5 items-start">
                <span className="text-sm mt-0.5">⏳</span>
                <p>
                  Waiting for verification. Once you click the link inside your email, this page will **automatically** verify you and redirect you to create your profile.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={loading}
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Checking...' : 'Check Verification Status Now'}
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading || resendCooldown > 0}
                  className="w-full py-3 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl transition-all text-center hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-center text-xs text-slate-400 dark:text-slate-500 font-medium hover:underline block mt-2"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
