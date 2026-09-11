import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3bsEP45F73tzRgshZN3GIX5oYoPgYxoE",
  authDomain: "campus-find-81a11.firebaseapp.com",
  projectId: "campus-find-81a11",
  storageBucket: "campus-find-81a11.firebasestorage.app",
  messagingSenderId: "511506597888",
  appId: "1:511506597888:web:08aed5b4feaaa2542bf0e5",
  measurementId: "G-W3B3XGCTY0"
};

// Initialise Firebase (guard against HMR double-init)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth — used for Phone OTP sign-in
export const auth = getAuth(app);
auth.languageCode = 'en';

export default app;
