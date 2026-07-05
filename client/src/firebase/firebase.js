// firebase.js - Real-Time Firebase Auth Connector with Mock Simulation Fallback
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber as firebaseSignIn, signInWithEmailAndPassword as firebaseSignInWithEmail, createUserWithEmailAndPassword as firebaseCreateUserWithEmail, sendEmailVerification, reload, updatePassword, sendPasswordResetEmail } from 'firebase/auth';


let auth = null;
let isMockMode = true;

// 1. Firebase configuration credentials template
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localStorage.getItem('sleep_clarity_firebase_api_key') || 'AIzaSyCabQFVZgIUz-ZFi0MDl7Lt--ru7MM-434',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localStorage.getItem('sleep_clarity_firebase_auth_domain') || 'sleepclarity-d5f88.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localStorage.getItem('sleep_clarity_firebase_project_id') || 'sleepclarity-d5f88',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sleep-clarity-mock.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '794204766838',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:794204766838:web:623e26e193dbbac08f9557'
};

// 2. Mock Auth Class for fallback sandbox operations
class MockAuthInstance {
  constructor() {
    this.listeners = [];
    this.currentUser = this.loadUserFromStorage();
  }

  loadUserFromStorage() {
    const profile = localStorage.getItem('sleep_clarity_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      return {
        uid: 'mock-user-123',
        phoneNumber: parsed.phone || '+15550192834',
        displayName: parsed.name || 'Alex Developer',
        emailVerified: true,
        getIdToken: async () => Promise.resolve('mock-jwt-session-token'),
      };
    }
    return null;
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  // Simulated OTP sender/confirm adapter
  async signInWithPhoneNumber(phoneNumber) {
    console.log(`[Mock Mode] Sending OTP code to ${phoneNumber}`);
    return {
      confirm: async (verificationCode) => {
        if (verificationCode === '123456' || verificationCode.length === 6) {
          const uid = 'mock-user-123';
          localStorage.setItem('sleep_clarity_current_uid', uid);
          const existingProfile = localStorage.getItem(`sleep_clarity_${uid}_profile`);
          let profileName = '';
          
          if (existingProfile) {
            const parsed = JSON.parse(existingProfile);
            parsed.phone = phoneNumber;
            localStorage.setItem(`sleep_clarity_${uid}_profile`, JSON.stringify(parsed));
            profileName = parsed.name;
          } else {
            localStorage.setItem(`sleep_clarity_${uid}_profile`, JSON.stringify({
              name: '',
              sleepTime: '23:00',
              wakeTime: '07:00',
              goal: '',
              streak: 0,
              lastActive: new Date().toISOString().split('T')[0],
              phone: phoneNumber,
            }));
          }

          this.currentUser = {
            uid: 'mock-user-123',
            phoneNumber: phoneNumber,
            displayName: profileName || 'New User',
            getIdToken: async () => Promise.resolve('mock-jwt-session-token'),
          };
          this.notifyListeners();
          return { user: this.currentUser };
        } else {
          throw new Error('Invalid OTP code. Try "123456" for demo mode.');
        }
      }
    };
  }

  async signInWithEmailAndPassword(email, password) {
    console.log(`[Mock Mode] Signing in with email: ${email}`);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      throw new Error('The email address is badly formatted.');
    }

    const accounts = JSON.parse(localStorage.getItem('sleep_clarity_mock_accounts') || '{}');
    if (accounts[email]) {
      if (accounts[email] === password) {
        this.currentUser = {
          uid: `mock-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
          email: email,
          displayName: email.split('@')[0],
          emailVerified: true,
          getIdToken: async () => Promise.resolve('mock-jwt-session-token'),
        };
        this.notifyListeners();
        return { user: this.currentUser };
      } else {
        throw new Error('Incorrect password. Please try again.');
      }
    } else {
      throw new Error('Account does not exist. Switch to "Sign Up" to register this email.');
    }
  }

  async createUserWithEmailAndPassword(email, password) {
    console.log(`[Mock Mode] Creating account with email: ${email}`);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      throw new Error('The email address is badly formatted.');
    }

    const accounts = JSON.parse(localStorage.getItem('sleep_clarity_mock_accounts') || '{}');
    accounts[email] = password;
    localStorage.setItem('sleep_clarity_mock_accounts', JSON.stringify(accounts));

    const uid = `mock-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
    this.currentUser = {
      uid: uid,
      email: email,
      displayName: email.split('@')[0],
      emailVerified: false,
      getIdToken: async () => Promise.resolve('mock-jwt-session-token'),
    };

    localStorage.setItem('sleep_clarity_current_uid', uid);
    localStorage.setItem(`sleep_clarity_${uid}_profile`, JSON.stringify({
      name: email.split('@')[0],
      sleepTime: '23:00',
      wakeTime: '07:00',
      goal: 'Get productive & sleep early',
      streak: 0,
      lastActive: new Date().toISOString().split('T')[0],
      phone: '',
    }));

    this.notifyListeners();
    return { user: this.currentUser };
  }

  async signOut() {
    this.currentUser = null;
    this.notifyListeners();
    return Promise.resolve();
  }

  async sendEmailVerification() {
    console.log(`[Mock Mode] Verification email sent to ${this.currentUser?.email}`);
    return Promise.resolve();
  }

  async reloadUser() {
    console.log("[Mock Mode] Reloading user");
    if (this.currentUser) {
      this.currentUser.emailVerified = true;
      this.notifyListeners();
    }
    return Promise.resolve();
  }

  async updatePassword(password) {
    if (this.currentUser) {
      console.log(`[Mock Mode] Password updated for ${this.currentUser.email}`);
      const accounts = JSON.parse(localStorage.getItem('sleep_clarity_mock_accounts') || '{}');
      accounts[this.currentUser.email] = password;
      localStorage.setItem('sleep_clarity_mock_accounts', JSON.stringify(accounts));
    }
    return Promise.resolve();
  }

  async sendPasswordResetEmail(email) {
    console.log(`[Mock Mode] Password reset email sent to: ${email}`);
    return Promise.resolve();
  }
}

const hasFirebaseKeys = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'PLACEHOLDER' &&
  firebaseConfig.apiKey !== '';

if (hasFirebaseKeys) {
  try {
    const app = initializeApp(firebaseConfig);
    const fbAuth = getAuth(app);
    
    // Wrap real auth object to conform to our signIn / getIdToken format
    auth = {
      currentUser: null,
      onAuthStateChanged: (callback) => fbAuth.onAuthStateChanged((user) => {
        auth.currentUser = user;
        callback(user);
      }),
      signOut: () => fbAuth.signOut(),
      signInWithPhoneNumber: async (phoneNumber, appVerifier) => {
        // Set up default invisible recaptcha element on the window if not created
        let verifier = appVerifier;
        if (!verifier || !verifier.render) {
          if (window.recaptchaVerifier) {
            try {
              window.recaptchaVerifier.clear();
            } catch (e) {
              console.warn("Failed to clear previous RecaptchaVerifier:", e);
            }
          }
          window.recaptchaVerifier = new RecaptchaVerifier(fbAuth, 'recaptcha-container', {
            size: 'invisible'
          });
          verifier = window.recaptchaVerifier;
        }
        return firebaseSignIn(fbAuth, phoneNumber, verifier);
      },
      signInWithEmailAndPassword: (email, password) => {
        return firebaseSignInWithEmail(fbAuth, email, password);
      },
      createUserWithEmailAndPassword: async (email, password) => {
        const result = await firebaseCreateUserWithEmail(fbAuth, email, password);
        if (result && result.user) {
          try {
            await sendEmailVerification(result.user);
          } catch (e) {
            console.error("Failed to send verification email:", e);
          }
        }
        return result;
      },
      sendEmailVerification: async () => {
        if (fbAuth.currentUser) {
          return sendEmailVerification(fbAuth.currentUser);
        }
      },
      reloadUser: async () => {
        if (fbAuth.currentUser) {
          await reload(fbAuth.currentUser);
          auth.currentUser = fbAuth.currentUser;
        }
      },
      updatePassword: async (password) => {
        if (fbAuth.currentUser) {
          await updatePassword(fbAuth.currentUser, password);
        }
      },
      sendPasswordResetEmail: (email) => {
        return sendPasswordResetEmail(fbAuth, email);
      }
    };
    
    isMockMode = false;
    console.log("Firebase SDK successfully loaded for real-time authentication.");
  } catch (error) {
    console.error("Firebase SDK init failed. Defaulting to mock mode.", error);
    auth = new MockAuthInstance();
    isMockMode = true;
  }
} else {
  auth = new MockAuthInstance();
  isMockMode = true;
}

export { auth, isMockMode };
export default auth;
