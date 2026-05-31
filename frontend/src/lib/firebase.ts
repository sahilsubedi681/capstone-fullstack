// lib/firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your Firebase configuration (directly with the values you provided)
const firebaseConfig = {
  apiKey: "AIzaSyA7aHE5fzRqqy6uWW3gLbPhUsGs-x8gMz8",
  authDomain: "capstone-project-85685.firebaseapp.com",
  projectId: "capstone-project-85685",
  storageBucket: "capstone-project-85685.firebasestorage.app",
  messagingSenderId: "72188027857",
  appId: "1:72188027857:web:9a55c3d09e612c9ce3b6f0",
  measurementId: "G-6P5TM9SYHF"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (e) {
  console.error("Firebase initialization error:", e);
  throw e;
}

// Google Auth provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper function for Google sign in
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

export { auth, db, signInWithGoogle, googleProvider };