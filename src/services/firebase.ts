import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCW8JKwdwFOKV4YACUzkIfB9hMAXjAoYQ4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "simpleeng.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "simpleeng",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "simpleeng.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "667245245817",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:667245245817:web:a5331f8a5a3efce9fbaba8",
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Explicitly enforce persistent auth across mobile browser reloads & standalone PWA
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Firebase setPersistence warning:', err);
    });
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization error:', error);
  }
}

export { app, auth, db };
