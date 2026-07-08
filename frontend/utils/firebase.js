// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "login-instructoplus.firebaseapp.com",
  projectId: "login-instructoplus",
  storageBucket: "login-instructoplus.firebasestorage.app",
  messagingSenderId: "176081943725",
  appId: "1:176081943725:web:cce8a8f02e42dcfc899a24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth=getAuth(app)
const provider = new GoogleAuthProvider();
export {auth,provider}