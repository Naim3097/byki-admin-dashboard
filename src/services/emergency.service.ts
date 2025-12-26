// Emergency Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { EmergencyRequest, EmergencyStatus, EmergencyStats } from '../types/emergency';
import { parseFirestoreDate } from '../utils/helpers';

export const emergencyService = {
  // Get all emergency requests with filters
  async getEmergencyRequests(filters?: {
    status?: EmergencyStatus;
    userId?: string;
  }): Promise<EmergencyRequest[]> {
    let q = query(collection(db, 'emergency_requests'), orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(
        collection(db, 'emergency_requests'),
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    }

    if (filters?.userId) {
      q = query(
        collection(db, 'emergency_requests'),
        where('userId', '==', filters.userId),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.transformEmergency(doc.id, doc.data()));
  },

  // Get active emergencies (pending, dispatched, enRoute)
  async getActiveEmergencies(): Promise<EmergencyRequest[]> {
    const q = query(
      collection(db, 'emergency_requests'),
      where('status', 'in', ['pending', 'dispatched', 'enRoute']),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const emergencies = snapshot.docs.map((doc) => this.transformEmergency(doc.id, doc.data()));
    
    // Enrich with user data if userName is missing
    return this.enrichWithUserData(emergencies);
  },

  // Subscribe to active emergencies (real-time)
  subscribeToActiveEmergencies(
    callback: (emergencies: EmergencyRequest[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'emergency_requests'),
      where('status', 'in', ['pending', 'dispatched', 'enRoute', 'arrived']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const emergencies = snapshot.docs.map((doc) =>
        this.transformEmergency(doc.id, doc.data())
      );
      // Enrich with user data
      const enriched = await this.enrichWithUserData(emergencies);
      callback(enriched);
    });
  },

  // Subscribe to pending emergencies count
  subscribeToPendingCount(callback: (count: number) => void): Unsubscribe {
    const q = query(
      collection(db, 'emergency_requests'),
      where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  },

  // Get single emergency request
  async getEmergencyRequest(requestId: string): Promise<EmergencyRequest | null> {
    const docSnap = await getDoc(doc(db, 'emergency_requests', requestId));
    if (!docSnap.exists()) return null;
    return this.transformEmergency(docSnap.id, docSnap.data());
  },

  // Update emergency status
  async updateEmergencyStatus(
    requestId: string,
    status: EmergencyStatus,
    additionalData?: Partial<EmergencyRequest>
  ): Promise<void> {
    const docRef = doc(db, 'emergency_requests', requestId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now(),
    };

    // Add timestamp based on status
    if (status === 'dispatched') {
      updateData.dispatchedAt = Timestamp.now();
    } else if (status === 'arrived') {
      updateData.arrivedAt = Timestamp.now();
    } else if (status === 'completed') {
      updateData.completedAt = Timestamp.now();
    }

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    await updateDoc(docRef, updateData);
  },

  // Assign mechanic to emergency
  async assignMechanic(
    requestId: string,
    mechanicId: string,
    mechanicName: string
  ): Promise<void> {
    const docRef = doc(db, 'emergency_requests', requestId);
    await updateDoc(docRef, {
      mechanicId,
      mechanicName,
      status: 'dispatched',
      dispatchedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  // Get emergency stats
  async getEmergencyStats(): Promise<EmergencyStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allSnapshot = await getDocs(collection(db, 'emergency_requests'));
    const allRequests = allSnapshot.docs.map((doc) => doc.data());

    // Calculate average response time (from creation to dispatched)
    const completedWithTimes = allRequests.filter(
      (r) => r.dispatchedAt && r.createdAt
    );
    const avgResponseTime =
      completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum, r) => {
            const created = r.createdAt?.toDate?.()?.getTime() || 0;
            const dispatched = r.dispatchedAt?.toDate?.()?.getTime() || 0;
            return sum + (dispatched - created) / (1000 * 60); // in minutes
          }, 0) / completedWithTimes.length
        : 0;

    return {
      total: allRequests.length,
      pending: allRequests.filter((r) => r.status === 'pending').length,
      active: allRequests.filter((r) =>
        ['dispatched', 'enRoute', 'arrived'].includes(r.status)
      ).length,
      completedToday: allRequests.filter((r) => {
        const completedAt = r.completedAt?.toDate?.();
        return completedAt && completedAt >= today && r.status === 'completed';
      }).length,
      averageResponseTime: Math.round(avgResponseTime),
    };
  },

  // Transform Firestore data to EmergencyRequest type
  transformEmergency(id: string, data: DocumentData): EmergencyRequest {
    return {
      id,
      userId: data.userId,
      userName: data.userName,
      userPhone: data.userPhone,
      vehicleId: data.vehicleId,
      vehicleInfo: data.vehicleInfo,
      type: data.type || 'other',
      status: data.status || 'pending',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      address: data.address || '',
      description: data.description,
      mechanicId: data.mechanicId,
      mechanicName: data.mechanicName,
      estimatedArrival: data.estimatedArrival ? parseFirestoreDate(data.estimatedArrival) : undefined,
      dispatchedAt: data.dispatchedAt ? parseFirestoreDate(data.dispatchedAt) : undefined,
      arrivedAt: data.arrivedAt ? parseFirestoreDate(data.arrivedAt) : undefined,
      completedAt: data.completedAt ? parseFirestoreDate(data.completedAt) : undefined,
      createdAt: parseFirestoreDate(data.createdAt),
      updatedAt: parseFirestoreDate(data.updatedAt),
    };
  },

  // Enrich emergency requests with user data from users collection
  async enrichWithUserData(emergencies: EmergencyRequest[]): Promise<EmergencyRequest[]> {
    // Get unique user IDs that need enrichment
    const userIdsToFetch = [...new Set(
      emergencies
        .filter(e => e.userId && !e.userName)
        .map(e => e.userId)
    )];

    if (userIdsToFetch.length === 0) {
      return emergencies;
    }

    // Fetch user data
    const userDataMap = new Map<string, { name: string; phone?: string }>();
    
    await Promise.all(
      userIdsToFetch.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userDataMap.set(userId, {
              name: userData.name || userData.displayName || 'User',
              phone: userData.phone || userData.phoneNumber,
            });
          }
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
        }
      })
    );

    // Enrich emergencies with user data
    return emergencies.map(emergency => {
      if (!emergency.userName && emergency.userId && userDataMap.has(emergency.userId)) {
        const userData = userDataMap.get(emergency.userId)!;
        return {
          ...emergency,
          userName: userData.name,
          userPhone: emergency.userPhone || userData.phone,
        };
      }
      return emergency;
    });
  },
};
