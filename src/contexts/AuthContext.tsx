import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isConfigured } from '../firebase';
import type { UserProfile } from '../services/gameService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'プレイヤー',
  photoURL: null,
  totalGames: 0,
  totalCorrect: 0,
  bestScore: 0,
  bestTime: 0,
  collectedMountains: [],
};

/** Firestoreにユーザードキュメントを作成（初回のみ）し、プロフィールを返す */
async function ensureUserDoc(user: User): Promise<UserProfile> {
  if (!db) return { ...DEFAULT_PROFILE, displayName: user.displayName || 'プレイヤー' };
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const newProfile = {
      displayName: user.displayName || 'プレイヤー',
      photoURL: user.photoURL || null,
      totalGames: 0,
      totalCorrect: 0,
      bestScore: 0,
      bestTime: 0,
      collectedMountains: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, newProfile);
    return newProfile as UserProfile;
  }
  return snap.data() as UserProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const refreshProfile = async () => {
    if (!user || !db) return;
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) setUserProfile(snap.data() as UserProfile);
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profile = await ensureUserDoc(u);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error('メールアドレスが確認されていません。登録時に送信された確認メールのリンクをクリックしてください。');
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await firebaseSignOut(auth); // 一旦ログアウトして確認待ちにする
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not configured');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase not configured');
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest: !isConfigured || !user,
        userProfile,
        refreshProfile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
