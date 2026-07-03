import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MockServices } from '../services/MockServices';
import { Moon, Shield, ArrowRight, Smartphone, Clock, Sparkles, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { user, profile, sendOTP, loginWithEmail, registerWithEmail, onboardUser, isMockMode, sendVerificationEmail, reloadUser, logout, updateUserPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('phone'); // phone, otp, setup, verify
  const [authMethod, setAuthMethod] = useState('phone'); // phone, email
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Monitor query params to sync Sign In / Sign Up modes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
      setAuthMethod('email'); // Default to email sign up flow
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: 'None', color: 'text-slate-400', barColor: 'bg-slate-200 dark:bg-slate-850' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (hasLetter && hasNumber) score += 1;
    if (hasSpecial) score += 1;
    const mapping = [
      { score: 0, text: 'Very Weak', color: 'text-red-500', barColor: 'bg-red-500' },
      { score: 1, text: 'Weak', color: 'text-red-400', barColor: 'bg-red-400' },
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
      const isBypassed = localStorage.getItem(`sleep_clarity_bypass_${user.uid}`) === 'true';
      if (user.email && !user.emailVerified && !isBypassed) {
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

  const handleDevBypass = () => {
    if (user) {
      localStorage.setItem(`sleep_clarity_bypass_${user.uid}`, 'true');
      const profileData = MockServices.getProfile();
      if (profileData && profileData.name) {
        navigate('/dashboard');
      } else {
        setStep('setup');
      }
    }
  };

  const handleCheckVerification = async () => {
    setError('');
    setLoading(true);
    try {
      const refreshedUser = await reloadUser();
      const isBypassed = localStorage.getItem(`sleep_clarity_bypass_${user?.uid}`) === 'true';
      if (refreshedUser && (refreshedUser.emailVerified || isBypassed)) {
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

  // Handle Phone Submit
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    
    // Automatically combine country code and number
    const fullNumber = countryCode + cleanPhone;
    setLoading(true);
    try {
      const result = await sendOTP(fullNumber);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check your credentials.');
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

  // Handle OTP Submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const authResult = await confirmationResult.confirm(otp);
      
      const connectionMode = localStorage.getItem('sleep_clarity_connection_mode') || 'offline';
      if (connectionMode === 'fullstack') {
        await MockServices.syncFromBackend();
      }
      
      const profileData = MockServices.getProfile();
      
      if (profileData && profileData.name) {
        // Completed onboarding already, go directly to Dashboard
        navigate('/dashboard');
      } else {
        // New profile or hasn't finished setup
        setStep('setup');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Try "123456" for demo mode.');
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
    if (setupPassword !== confirmPassword) {
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

          {/* Method Selector Tabs */}
          {step !== 'setup' && step !== 'otp' && (
            <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMethod === 'phone' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMethod === 'email' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                Email Password
              </button>
            </div>
          )}

          {/* STEP 1: PHONE NUMBER INPUT / EMAIL PASSWORD INPUT */}
          {step === 'phone' && (
            authMethod === 'phone' ? (
              <div className="page-fade-in">
                <h2 className="font-display font-bold text-xl mb-1.5">Welcome to Clarity</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Log in or create an account using your phone number. No passwords required.
                </p>

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div id="recaptcha-container"></div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-2 uppercase tracking-wider">Phone Number</label>
                    <div className="flex gap-2.5">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        disabled={loading}
                        className="px-3 py-3.5 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+33">🇫🇷 +33</option>
                      </select>
                      
                      <div className="relative flex-1">
                        <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading}
                          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40 dark:focus:ring-indigoCalm-500/30"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification OTP'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
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

                      <div className="relative">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">Password</label>
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
            )
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <div className="page-fade-in">
              <h2 className="font-display font-bold text-xl mb-1.5">Verification</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                We've sent a 6-digit verification code to <span className="font-semibold text-slate-800 dark:text-slate-200">{phone}</span>.
              </p>
              
              {isMockMode && (
                <div className="p-3 bg-indigoCalm-500/10 border border-indigoCalm-500/20 text-indigoCalm-600 dark:text-indigoCalm-400 text-xs rounded-xl font-medium mb-6">
                  Demo Code: Enter <span className="font-bold underline">123456</span> to bypass authentication.
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-2 uppercase tracking-wider">6-Digit Code</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-xl text-center text-lg font-bold letter tracking-[0.4em] focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40 dark:focus:ring-indigoCalm-500/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full text-center text-xs text-slate-400 dark:text-slate-500 font-medium hover:underline block mt-2"
                >
                  Change phone number
                </button>
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* STEP 4: EMAIL VERIFICATION REQUIRED */}
          {step === 'verify' && (
            <div className="page-fade-in text-left">
              <h2 className="font-display font-bold text-xl mb-1.5">Verify your Email</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                We sent a verification link to <span className="font-semibold text-slate-700 dark:text-indigoCalm-400">{user?.email}</span>. Please click the link to verify your account and start your planning buffer setup.
              </p>

              {isMockMode && (
                <div className="p-3.5 bg-indigoCalm-500/10 border border-indigoCalm-500/20 text-indigoCalm-600 dark:text-indigoCalm-400 text-xs rounded-xl font-medium mb-5 leading-relaxed">
                  💡 **Running in Mock Dev Mode**: Since this is running in sandbox mode, no real email is sent to your inbox. Simply click the **"I have verified my email"** button below to automatically verify and login!
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={loading}
                  className="w-full py-4 bg-indigoCalm-600 hover:bg-indigoCalm-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigoCalm-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Checking...' : 'I have verified my email'}
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

                {window.location.hostname === 'localhost' && (
                  <button
                    type="button"
                    onClick={handleDevBypass}
                    className="w-full text-center text-xs text-amber-600 dark:text-amber-400 font-bold border border-dashed border-amber-300 dark:border-amber-900/60 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all mt-4"
                  >
                    ⚠️ Dev Bypass: Skip email verification (Localhost only)
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
