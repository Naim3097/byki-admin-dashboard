// Review Types - Aligned with Mobile App

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  targetId: string; // workshopId or productId
  targetType: 'workshop' | 'product';
  rating: number; // 1-5
  comment?: string;
  imageUrls: string[];
  isApproved: boolean; // For moderation
  isHidden: boolean; // Admin can hide inappropriate reviews
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewStats {
  total: number;
  averageRating: number;
  pending: number; // Awaiting moderation
  approved: number;
  hidden: number;
  byRating: Record<number, number>; // Count by rating (1-5)
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FAQCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
