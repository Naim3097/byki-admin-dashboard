// Users Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, LoyaltyAccount, Vehicle, Address } from '../types/user';
import { parseFirestoreDate } from '../utils/helpers';

export const usersService = {
  // Get users with pagination
  async getUsers(options?: {
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
    searchTerm?: string;
    role?: string;
  }): Promise<{ users: User[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    const pageSize = options?.pageSize || 50;
    
    try {
      // Try with orderBy first
      let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(pageSize));

      if (options?.lastDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          startAfter(options.lastDoc),
          limit(pageSize)
        );
      }

      if (options?.role) {
        q = query(
          collection(db, 'users'),
          where('role', '==', options.role),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      let users = snapshot.docs.map((doc) => this.transformUser(doc.id, doc.data()));

      // Client-side search filtering
      if (options?.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        users = users.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.phone?.includes(term)
        );
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      return { users, lastDoc };
    } catch (error) {
      // Fallback: get all users without ordering (for collections without createdAt index)
      console.warn('Falling back to unordered query:', error);
      const snapshot = await getDocs(collection(db, 'users'));
      let users = snapshot.docs.map((doc) => this.transformUser(doc.id, doc.data()));
      
      // Sort client-side
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Apply role filter
      if (options?.role) {
        users = users.filter(u => u.role === options.role);
      }
      
      // Apply search
      if (options?.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        users = users.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.phone?.includes(term)
        );
      }
      
      return { users: users.slice(0, pageSize), lastDoc: null };
    }
  },

  // Get single user
  async getUser(userId: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (!docSnap.exists()) return null;
    return this.transformUser(docSnap.id, docSnap.data());
  },

  // Update user
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Get user's vehicles
  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    const snapshot = await getDocs(collection(db, `users/${userId}/vehicles`));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      userId,
      ...doc.data(),
    })) as Vehicle[];
  },

  // Get user's addresses
  async getUserAddresses(userId: string): Promise<Address[]> {
    const snapshot = await getDocs(collection(db, `users/${userId}/addresses`));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      userId,
      ...doc.data(),
    })) as Address[];
  },

  // Get user's loyalty account
  async getLoyaltyAccount(userId: string): Promise<LoyaltyAccount | null> {
    const docSnap = await getDoc(doc(db, 'loyalty_accounts', userId));
    if (!docSnap.exists()) return null;
    return {
      userId,
      ...docSnap.data(),
    } as LoyaltyAccount;
  },

  // Get user stats
  async getUserStats(): Promise<{
    total: number;
    newThisMonth: number;
    byRole: Record<string, number>;
  }> {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map((doc) => doc.data());

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return {
      total: users.length,
      newThisMonth: users.filter((u) => {
        const created = parseFirestoreDate(u.createdAt);
        return created && created >= startOfMonth;
      }).length,
      byRole: users.reduce(
        (acc, u) => {
          const role = u.role || 'user';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },

  // Transform Firestore data to User type
  transformUser(id: string, data: DocumentData): User {
    return {
      id,
      email: data.email || '',
      name: data.name || data.displayName || '',
      phone: data.phone || data.phoneNumber,
      profileImageUrl: data.profileImageUrl || data.photoURL,
      role: data.role || 'user',
      deviceTokens: data.deviceTokens || [],
      createdAt: parseFirestoreDate(data.createdAt),
      updatedAt: parseFirestoreDate(data.updatedAt),
      // Admin-only fields
      status: data.status,
      suspendedAt: data.suspendedAt ? parseFirestoreDate(data.suspendedAt) : undefined,
      suspensionReason: data.suspensionReason,
      bannedAt: data.bannedAt ? parseFirestoreDate(data.bannedAt) : undefined,
      banReason: data.banReason,
    };
  },
};
