// Auth Service
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AdminUser } from '../types/user';

export const authService = {
  // Sign in
  async signIn(email: string, password: string): Promise<AdminUser> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Check if user has admin privileges
    if (!['staff', 'admin', 'superAdmin'].includes(userData.role)) {
      await firebaseSignOut(auth);
      throw new Error('Unauthorized: Admin access required');
    }

    return {
      uid: user.uid,
      email: user.email || '',
      name: userData.name,
      role: userData.role,
    };
  },

  // Sign out
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  // Auth state listener
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user with role
  async getCurrentAdmin(): Promise<AdminUser | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    if (!['staff', 'admin', 'superAdmin'].includes(userData.role)) {
      return null;
    }

    return {
      uid: user.uid,
      email: user.email || '',
      name: userData.name,
      role: userData.role,
    };
  },

  // Get current Firebase user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};
