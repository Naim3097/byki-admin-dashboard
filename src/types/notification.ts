// Notification Types - Aligned with Mobile App

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

export type NotificationType =
  | 'booking'
  | 'order'
  | 'promo'
  | 'system'
  | 'emergency';

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  targetType: 'single' | 'segment' | 'all';
  targetUserId?: string;
  targetTier?: string;
  data?: Record<string, string>;
  scheduledAt?: Date;
}
