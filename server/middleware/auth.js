// auth.js - Firebase JWT Token Verification Middleware with Mock Dev Fallback
const admin = require('firebase-admin');

// Initialize Firebase Admin dynamically if credentials are provided
let isFirebaseInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    isFirebaseInitialized = true;
    console.log("Firebase Admin SDK successfully initialized.");
  } catch (error) {
    console.error("Firebase Admin initialization failed. Falling back to Dev Auth mode.", error);
  }
} else {
  console.log("No FIREBASE_SERVICE_ACCOUNT_JSON detected. Running server in Dev Auth Mode.");
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If we are in mock dev mode, let requests pass with a fallback developer user ID
    if (!isFirebaseInitialized) {
      const xUid = req.headers['x-user-uid'];
      req.user = {
        uid: xUid || 'mock-user-123',
        phone: '+15550192834',
        name: 'Alex Developer',
      };
      return next();
    }
    return res.status(401).json({ error: 'Authorization header missing or invalid format.' });
  }

  const token = authHeader.split('Bearer ')[1];

  if (!isFirebaseInitialized) {
    // Dev bypass: If token matches a demo string or we are in mock mode
    const xUid = req.headers['x-user-uid'];
    req.user = {
      uid: xUid || (token !== 'dev-mock-session-token' ? token : 'mock-user-123'),
      phone: '+15550192834',
      name: 'Alex Developer',
    };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      phone: decodedToken.phone_number || '',
      name: decodedToken.name || '',
    };
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(403).json({ error: 'Unauthorized: Firebase Token verification failed.' });
  }
};

module.exports = verifyToken;
