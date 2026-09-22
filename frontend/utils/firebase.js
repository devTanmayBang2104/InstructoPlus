// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const apiKey = import.meta.env.VITE_FIREBASE_APIKEY || "AIzaSyDummyKeyForLocalDevelopment12345";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "login-instructoplus.firebaseapp.com",
  projectId: "login-instructoplus",
  storageBucket: "login-instructoplus.firebasestorage.app",
  messagingSenderId: "176081943725",
  appId: "1:176081943725:web:cce8a8f02e42dcfc899a24"
};

// Safely initialize Firebase
let app;
let auth;
let provider;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
} catch (error) {
  console.warn("Firebase initialization notice:", error.message);
}

export { auth, provider };