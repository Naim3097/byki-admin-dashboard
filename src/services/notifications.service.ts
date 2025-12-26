// Notifications Service
import {
  collection,
  // doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, PushNotificationPayload } from '../types/notification';
import { parseFirestoreDate } from '../utils/helpers';

export const notificationsService = {
  // Get notifications for a user
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => this.transformNotification(doc.id, doc.data()));
    } catch (error) {
      console.warn('Notifications query failed, trying without order:', error);
      const q = query(collection(db, 'notifications'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map((doc) => this.transformNotification(doc.id, doc.data()));
      return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  // Send notification to single user
  async sendToUser(userId: string, notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      userId,
      isRead: false,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Send notification to multiple users
  async sendToUsers(userIds: string[], notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>): Promise<void> {
    const promises = userIds.map((userId) =>
      addDoc(collection(db, 'notifications'), {
        ...notification,
        userId,
        isRead: false,
        createdAt: Timestamp.now(),
      })
    );
    await Promise.all(promises);
  },

  // Send notification to all users
  async sendToAll(notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>): Promise<void> {
    // Get all user IDs
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userIds = usersSnapshot.docs.map((doc) => doc.id);
    
    await this.sendToUsers(userIds, notification);
  },

  // Create push notification payload (for use with Firebase Cloud Functions or Cloud Messaging)
  createPushPayload(payload: PushNotificationPayload): object {
    return {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        ...payload.data,
      },
    };
  },

  // Get notification stats
  async getNotificationStats(): Promise<{
    sentToday: number;
    sentThisWeek: number;
    sentThisMonth: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const snapshot = await getDocs(collection(db, 'notifications'));
    const notifications = snapshot.docs.map((doc) => doc.data());

    return {
      sentToday: notifications.filter((n) => {
        const created = parseFirestoreDate(n.createdAt);
        return created && created >= startOfDay;
      }).length,
      sentThisWeek: notifications.filter((n) => {
        const created = parseFirestoreDate(n.createdAt);
        return created && created >= startOfWeek;
      }).length,
      sentThisMonth: notifications.filter((n) => {
        const created = parseFirestoreDate(n.createdAt);
        return created && created >= startOfMonth;
      }).length,
    };
  },

  // Transform Firestore data to Notification type
  transformNotification(id: string, data: DocumentData): Notification {
    return {
      id,
      userId: data.userId,
      title: data.title || '',
      body: data.body || '',
      type: data.type || 'system',
      data: data.data,
      isRead: data.isRead ?? false,
      createdAt: parseFirestoreDate(data.createdAt) || new Date(),
    };
  },
};
