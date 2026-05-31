// auth.tsx - Replace the entire file with this:

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "host" | "seeker" | "admin";
  status: "active" | "suspended";
  verified?: boolean;
  age?: number | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  suburb?: string | null;
  state?: string | null;
  phone?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  smokes?: boolean | null;
  hasPets?: boolean | null;
  lifestyle?: string | null;
  comfortableWithVisitors?: boolean | null;
  communicationStyle?: string | null;
  profileViews?: number;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  signInWithGoogle: () => Promise<FirebaseUser>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MAGIC_LINK_EMAIL_KEY = "tribesilver_magic_email";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (fbUser: FirebaseUser) => {
    const profileDoc = await getDoc(doc(db, "users", fbUser.uid));
    if (profileDoc.exists()) {
      setUser(profileDoc.data() as UserProfile);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadProfile(fbUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (firebaseUser) await loadProfile(firebaseUser);
  };

  const setUserProfile = (profile: UserProfile) => setUser(profile);

  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

const sendMagicLink = async (email: string): Promise<void> => {
  const origin = window.location.origin;
  
  const actionCodeSettings = {
    // Use a simple, clean URL
    url: `${origin}/finish-login`,
    handleCodeInApp: true,
    // Add this for better debugging
    dynamicLinkDomain: undefined,
  };
  
  console.log("Sending magic link with URL:", actionCodeSettings.url);
  
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
    console.log("Magic link sent successfully");
  } catch (error) {
    console.error("Error sending magic link:", error);
    throw error;
  }
};

  const completeMagicLinkSignIn = async (email: string): Promise<FirebaseUser> => {
    const result = await signInWithEmailLink(auth, email, window.location.href);
    localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
    return result.user;
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, refreshProfile, setUserProfile, signInWithGoogle, sendMagicLink, completeMagicLinkSignIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function isSignInLink(url: string): boolean {
  try {
    return isSignInWithEmailLink(auth, url);
  } catch {
    return false;
  }
}

export function getMagicLinkEmail(): string | null {
  return localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
}