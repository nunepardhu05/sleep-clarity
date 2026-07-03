// AuthContext.jsx - React State Context for Session, Onboarding, and Connection Modes
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isMockMode } from '../firebase/firebase';
import { MockServices } from '../services/MockServices';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [backendMode, setBackendMode] = useState(() => {
    return localStorage.getItem('sleep_clarity_connection_mode') || 'fullstack'; // offline or fullstack
  });

  // Track Auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        localStorage.setItem('sleep_clarity_current_uid', currentUser.uid);
        setUser(currentUser);
        // Load additional profile details from LocalStorage (or later backend)
        const userProfile = MockServices.getProfile();
        setProfile(userProfile);
      } else {
        localStorage.removeItem('sleep_clarity_current_uid');
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync data from database when in fullstack mode
  useEffect(() => {
    if (user && backendMode === 'fullstack') {
      const syncData = async () => {
        await MockServices.syncFromBackend();
        const userProfile = MockServices.getProfile();
        setProfile(userProfile);
      };
      syncData();
    }
  }, [user, backendMode]);

  // Phone Sign-In
  const sendOTP = async (phoneNumber) => {
    try {
      // Create a mock verifier if browser lacks full Recaptcha
      const verifier = { type: 'recaptcha' };
      const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, verifier);
      
      // Intercept confirmation logic to set current UID immediately
      const originalConfirm = confirmationResult.confirm;
      confirmationResult.confirm = async (otpCode) => {
        const res = await originalConfirm(otpCode);
        if (res && res.user) {
          localStorage.setItem('sleep_clarity_current_uid', res.user.uid);
        }
        return res;
      };
      
      return confirmationResult;
    } catch (error) {
      console.error("Failed sending OTP:", error);
      throw error;
    }
  };

  // Email Login
  const loginWithEmail = async (email, password) => {
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      if (result && result.user) {
        localStorage.setItem('sleep_clarity_current_uid', result.user.uid);
      }
      return result;
    } catch (error) {
      console.error("Failed Email Login:", error);
      throw error;
    }
  };

  // Email Registration
  const registerWithEmail = async (email, password) => {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      if (result && result.user) {
        localStorage.setItem('sleep_clarity_current_uid', result.user.uid);
      }
      return result;
    } catch (error) {
      console.error("Failed Email Registration:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('sleep_clarity_current_uid');
    await auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  // Save profile setup details (Onboarding completion)
  const onboardUser = (onboardingData) => {
    const existing = MockServices.getProfile() || {};
    const updated = {
      ...existing,
      ...onboardingData,
      phone: user?.phoneNumber || existing.phone || '',
      streak: existing.streak !== undefined ? existing.streak : 0,
      lastActive: existing.lastActive || new Date().toISOString().split('T')[0],
    };
    
    // Save locally & database sync
    const savedProfile = MockServices.updateProfile(updated);
    setProfile(savedProfile);
    
    // Update user display name in session
    if (user) {
      setUser(prev => ({ ...prev, displayName: onboardingData.name }));
    }
  };

  // Update Settings
  const updateProfile = (settingsData) => {
    const updated = MockServices.updateProfile(settingsData);
    setProfile(updated);
    if (settingsData.name && user) {
      setUser(prev => ({ ...prev, displayName: settingsData.name }));
    }
  };

  // Toggle backend mode
  const toggleConnectionMode = (mode) => {
    localStorage.setItem('sleep_clarity_connection_mode', mode);
    setBackendMode(mode);
  };

  const sendVerificationEmail = async () => {
    if (auth.sendEmailVerification) {
      await auth.sendEmailVerification();
    }
  };

  const reloadUser = async () => {
    if (auth.reloadUser) {
      await auth.reloadUser();
      setUser(auth.currentUser ? { ...auth.currentUser } : null);
      return auth.currentUser;
    }
  };

  const updateUserPassword = async (password) => {
    if (auth.updatePassword) {
      await auth.updatePassword(password);
    }
  };

  const value = {
    user,
    profile,
    loading,
    backendMode,
    isMockMode,
    sendOTP,
    loginWithEmail,
    registerWithEmail,
    logout,
    onboardUser,
    updateProfile,
    toggleConnectionMode,
    sendVerificationEmail,
    reloadUser,
    updateUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
