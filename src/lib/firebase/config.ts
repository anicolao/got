import { browser } from '$app/environment';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBTNg60q0X2AAEIUz5fpXPtOJfUT4cndDA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'words-62ed1.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'words-62ed1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'words-62ed1.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1011220640118',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1011220640118:web:1dc6a545756e97fd214a57',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-77PFY8JX9Y'
};

export const app = browser ? (getApps()[0] ?? initializeApp(firebaseConfig)) : undefined;
export const auth = app ? getAuth(app) : undefined;
export const googleAuthProvider = new GoogleAuthProvider();
export const firestore = app ? getFirestore(app) : undefined;
