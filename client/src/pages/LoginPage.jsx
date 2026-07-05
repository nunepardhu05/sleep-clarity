import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MockServices } from '../services/MockServices';
import { Moon, Shield, ArrowRight, Smartphone, Clock, Sparkles, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { user, profile, sendOTP, loginWithEmail, registerWithEmail, onboardUser, isMockMode, sendVerificationEmail, reloadUser, logout, updateUserPassword, sendPasswordReset, simulateMockVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('email'); // email, signup-setup, signup-email, verify, password-setup
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
      setStep('signup-setup');
    } else if (mode === 'signin') {
      setIsSignUp(false);
      setStep('email');
      setEmailStage('email');
    }
  }, [location.search]);

  // Setup form states
  const [name, setName] = useState('');
  const [sleepHour, setSleepHour] = useState('11');
  const [sleepMin, setSleepMin] = useState('00');
  const [sleepPeriod, setSleepPeriod] = useState('PM');
  const [wakeHour, setWakeHour] = useState('7');
  const [wakeMin, setWakeMin] = useState('00');
  const [wakePeriod, setWakePeriod] = useState('AM');

  const convert12To24 = (h, m, p) => {
    let hour = parseInt(h);
    if (p === 'PM' && hour < 12) hour += 12;
    if (p === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${m || '00'}`;
  };

  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailStage, setEmailStage] = useState('email'); // email, password
  const [showPassword, setShowPassword] = useState(false);

  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, text: 'Weak', color: 'text-slate-400', barColor: 'bg-slate-200' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;

    const mapping = [
      { score: 0, text: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' },
      { score: 1, text: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' },
      { score: 2, text: 'Fair', color: 'text-amber-500', barColor: 'bg-amber-500' },
      { score: 3, text: 'Good', color: 'text-indigoCalm-500', barColor: 'bg-indigoCalm-500' },
      { score: 4, text: 'Strong', color: 'text-green-500', barColor: 'bg-green-500' },
    ];
    return mapping[score] || mapping[0];
  };

  const strength = getPasswordStrength(step === 'password-setup' ? setupPassword : password);

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
          setStep('password-setup');
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
              setStep('password-setup');
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
          setStep('password-setup');
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        setError('Invalid email address.');
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
        // Sign in flow: transition to password input stage if account exists
        setLoading(true);
        try {
          const exists = await MockServices.checkEmailExists(email.trim());
          if (!exists) {
            setError('Account does not exist. Please check your spelling or switch to Sign Up.');
            return;
          }
          setEmailStage('password');
        } catch (err) {
          setError('Error checking account existence. Please try again.');
        } finally {
          setLoading(false);
        }
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

  // Handle Sign Up Email Submit (Sends verification email)
  const handleSignUpEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Invalid email address.');
      return;
    }

    setLoading(true);
    try {
      const exists = await MockServices.checkEmailExists(email.trim());
      if (exists) {
        setError('This email is already in use. Please sign in instead.');
        return;
      }
      const tempPass = `TempPass_${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}!`;
      localStorage.setItem('sleep_clarity_temp_register_pass', tempPass);
      await registerWithEmail(email.trim(), tempPass);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 Sign Up Details Submit
  const handleSignUpSetupSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    const finalSleep = convert12To24(sleepHour, sleepMin, sleepPeriod);
    const finalWake = convert12To24(wakeHour, wakeMin, wakePeriod);

    const getSleepDurationInHours = (sleep, wake) => {
      const [sleepH, sleepM] = sleep.split(':').map(Number);
      const [wakeH, wakeM] = wake.split(':').map(Number);
      let diff = (wakeH * 60 + wakeM) - (sleepH * 60 + sleepM);
      if (diff < 0) diff += 24 * 60;
      return diff / 60;
    };
    const duration = getSleepDurationInHours(finalSleep, finalWake);
    if (duration < 6) {
      setError('Sleep target and wake target difference must be at least 6 hours.');
      return;
    }

    setStep('signup-email');
  };

  // Step 4 Password Setup Submit
  const handlePasswordSetupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!setupPassword) {
      setError('Please choose a password for your account.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    const hasLetter = /[a-zA-Z]/.test(setupPassword);
    const hasNumber = /[0-9]/.test(setupPassword);
    if (setupPassword.length < 8 || !hasLetter || !hasNumber) {
      setError('For security, passwords must be at least 8 characters long and contain both letters and numbers.');
      return;
    }
    
    setLoading(true);
    try {
      await updateUserPassword(setupPassword);
      
      const finalSleep = convert12To24(sleepHour, sleepMin, sleepPeriod);
      const finalWake = convert12To24(wakeHour, wakeMin, wakePeriod);
      
      onboardUser({ 
        name, 
        email: email || '',
        sleepTime: finalSleep, 
        wakeTime: finalWake,
        monthlyGoals: '',
        yearlyGoals: ''
      });
      
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

          {/* STEP 1 (SIGN IN): EMAIL PASSWORD INPUT */}
          {step === 'email' && (
            <div className="page-fade-in text-left">
              <h2 className="font-display font-bold text-xl mb-1.5">Welcome Back</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Sign in using your registered email and password.
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
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={loading}
                          className="text-[10px] font-bold text-indigoCalm-600 dark:text-indigoCalm-400 hover:underline"
                        >
                          Forgot Password?
                        </button>
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
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : (emailStage === 'email' ? 'Next' : 'Sign In')}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {emailStage === 'email' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setStep('signup-setup');
                    }}
                    className="w-full text-center text-xs text-slate-400 dark:text-slate-500 font-medium hover:underline block mt-2"
                  >
                    Don't have an account? Sign Up
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

          {/* STEP 1 (SIGN UP): NAME AND SLEEP/WAKE TARGETS */}
          {step === 'signup-setup' && (
            <div className="page-fade-in text-left">
              <h2 className="font-display font-bold text-xl mb-1.5">Create your Account</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Step 1 of 3: Enter your details and sleep/wake targets.
              </p>

              <form onSubmit={handleSignUpSetupSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Developer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Sleep Time
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={sleepHour}
                        onChange={(e) => setSleepHour(e.target.value)}
                        className="flex-1 px-2.5 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select
                        value={sleepMin}
                        onChange={(e) => setSleepMin(e.target.value)}
                        className="flex-1 px-2.5 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden"
                      >
                        {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={sleepPeriod}
                        onChange={(e) => setSleepPeriod(e.target.value)}
                        className="px-2 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Wake-up Time
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={wakeHour}
                        onChange={(e) => setWakeHour(e.target.value)}
                        className="flex-1 px-2.5 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select
                        value={wakeMin}
                        onChange={(e) => setWakeMin(e.target.value)}
                        className="flex-1 px-2.5 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden"
                      >
                        {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={wakePeriod}
                        onChange={(e) => setWakePeriod(e.target.value)}
                        className="px-2 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  Next step
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setStep('email');
                  }}
                  className="w-full text-center text-xs text-slate-400 dark:text-slate-500 font-medium hover:underline block mt-2"
                >
                  Already have an account? Sign In
                </button>
              </form>
            </div>
          )}

          {/* STEP 2 (SIGN UP): EMAIL ENTRY */}
          {step === 'signup-email' && (
            <div className="page-fade-in text-left">
              <h2 className="font-display font-bold text-xl mb-1.5">Enter your Email</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Step 2 of 3: Provide your email address to verify your account.
              </p>

              <form onSubmit={handleSignUpEmailSubmit} className="space-y-4">
                <div>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Registering...' : 'Send Verification Email'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('signup-setup')}
                  className="w-full text-center text-xs text-slate-400 dark:text-slate-500 font-medium hover:underline block mt-2"
                >
                  Back to Step 1
                </button>
              </form>
            </div>
          )}

          {/* STEP 3 (SIGN UP): EMAIL VERIFICATION PENDING */}
          {step === 'verify' && (
            <div className="page-fade-in text-left">
              <h2 className="font-display font-bold text-xl mb-1.5">Verify your Email</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                We sent a verification link to <span className="font-semibold text-slate-700 dark:text-indigoCalm-400">{user?.email}</span>. Please click the link inside your email to verify your account.
              </p>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-xl font-medium mb-5 leading-relaxed flex gap-2.5 items-start">
                <span className="text-sm mt-0.5">⏳</span>
                <p>
                  Waiting for verification. Once you click the link inside your email, this page will **automatically** verify you and redirect you to create your password.
                </p>
              </div>

              {isMockMode && (
                <div className="p-3.5 bg-indigoCalm-500/10 border border-indigoCalm-500/25 rounded-xl text-xs text-indigoCalm-700 dark:text-indigoCalm-400 mb-4 leading-relaxed">
                  <span className="font-bold">Mock Mode Debug:</span> Real email accounts require checking your real inbox. For mock sandbox verification, click below:
                  <button
                    type="button"
                    onClick={async () => {
                      simulateMockVerification();
                      await handleCheckVerification();
                    }}
                    className="mt-2 w-full py-2 bg-indigoCalm-600 text-white rounded-lg font-semibold hover:bg-indigoCalm-700 transition-colors shadow-sm"
                  >
                    Simulate Verification Link Click
                  </button>
                </div>
              )}

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
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 (SIGN UP): PASSWORD SETUP */}
          {step === 'password-setup' && (
            <div className="page-fade-in text-left">
              <h2 className="font-display font-bold text-xl mb-1.5">Choose your Password</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Step 3 of 3: Choose a secure password to complete your account setup.
              </p>

              <form onSubmit={handlePasswordSetupSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">Choose Password</label>
                  <div className="relative">
                    <input
                      type={showSetupPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      disabled={loading}
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
                    required
                    placeholder="••••••••"
                    value={setupConfirmPassword}
                    onChange={(e) => setSetupConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                  />
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Saving...' : 'Complete Setup & Go to Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
