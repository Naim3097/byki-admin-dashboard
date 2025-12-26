// Reviews Service - For Admin Dashboard
// Aligned with Mobile App's review system
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Review, ReviewStats } from '../types/review';
import { parseFirestoreDate } from '../utils/helpers';

export const reviewsService = {
  // ============ REVIEWS ============

  // Get all reviews with filters
  async getReviews(filters?: {
    targetType?: 'workshop' | 'product';
    targetId?: string;
    userId?: string;
    minRating?: number;
    maxRating?: number;
    isApproved?: boolean;
    isHidden?: boolean;
  }): Promise<Review[]> {
    let reviews: Review[] = [];
    
    try {
      let q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));

      if (filters?.targetType) {
        q = query(
          collection(db, 'reviews'),
          where('targetType', '==', filters.targetType),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.targetId) {
        q = query(
          collection(db, 'reviews'),
          where('targetId', '==', filters.targetId),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.userId) {
        q = query(
          collection(db, 'reviews'),
          where('userId', '==', filters.userId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      reviews = snapshot.docs.map((doc) => this.transformReview(doc.id, doc.data()));
    } catch (error) {
      console.warn('Reviews query with ordering failed, trying without order:', error);
      const snapshot = await getDocs(collection(db, 'reviews'));
      reviews = snapshot.docs.map((doc) => this.transformReview(doc.id, doc.data()));
      
      // Apply filters client-side
      if (filters?.targetType) {
        reviews = reviews.filter(r => r.targetType === filters.targetType);
      }
      if (filters?.targetId) {
        reviews = reviews.filter(r => r.targetId === filters.targetId);
      }
      if (filters?.userId) {
        reviews = reviews.filter(r => r.userId === filters.userId);
      }
      
      // Sort by createdAt descending
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Client-side filtering for additional filters
    if (filters?.minRating !== undefined) {
      reviews = reviews.filter((r) => r.rating >= filters.minRating!);
    }
    if (filters?.maxRating !== undefined) {
      reviews = reviews.filter((r) => r.rating <= filters.maxRating!);
    }
    if (filters?.isApproved !== undefined) {
      reviews = reviews.filter((r) => r.isApproved === filters.isApproved);
    }
    if (filters?.isHidden !== undefined) {
      reviews = reviews.filter((r) => r.isHidden === filters.isHidden);
    }

    return reviews;
  },

  // Get single review
  async getReview(reviewId: string): Promise<Review | null> {
    const docSnap = await getDoc(doc(db, 'reviews', reviewId));
    if (!docSnap.exists()) return null;
    return this.transformReview(docSnap.id, docSnap.data());
  },

  // Get reviews for a specific target (workshop or product)
  async getTargetReviews(targetId: string, targetType: 'workshop' | 'product'): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.transformReview(doc.id, doc.data()));
  },

  // Approve review
  async approveReview(reviewId: string): Promise<void> {
    const docRef = doc(db, 'reviews', reviewId);
    await updateDoc(docRef, {
      isApproved: true,
      updatedAt: Timestamp.now(),
    });
  },

  // Hide review (for inappropriate content)
  async hideReview(reviewId: string, hide: boolean = true): Promise<void> {
    const docRef = doc(db, 'reviews', reviewId);
    await updateDoc(docRef, {
      isHidden: hide,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete review
  async deleteReview(reviewId: string): Promise<void> {
    // Get review first to update aggregate rating
    const review = await this.getReview(reviewId);
    if (review) {
      await deleteDoc(doc(db, 'reviews', reviewId));
      // Update aggregate rating for the target
      await this.updateAggregateRating(review.targetId, review.targetType);
    }
  },

  // Update aggregate rating for a target
  async updateAggregateRating(targetId: string, targetType: 'workshop' | 'product'): Promise<void> {
    const reviews = await this.getTargetReviews(targetId, targetType);
    const visibleReviews = reviews.filter((r) => !r.isHidden && r.isApproved);

    if (visibleReviews.length === 0) {
      return;
    }

    const totalRating = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / visibleReviews.length;

    const collectionName = targetType === 'workshop' ? 'workshops' : 'products';
    const targetRef = doc(db, collectionName, targetId);

    await updateDoc(targetRef, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: visibleReviews.length,
    });
  },

  // Get review stats
  async getReviewStats(targetType?: 'workshop' | 'product'): Promise<ReviewStats> {
    let q = query(collection(db, 'reviews'));

    if (targetType) {
      q = query(collection(db, 'reviews'), where('targetType', '==', targetType));
    }

    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((doc) => this.transformReview(doc.id, doc.data()));

    const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const roundedRating = Math.round(r.rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        byRating[roundedRating] += 1;
      }
    });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);

    return {
      total: reviews.length,
      averageRating: reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0,
      pending: reviews.filter((r) => !r.isApproved && !r.isHidden).length,
      approved: reviews.filter((r) => r.isApproved).length,
      hidden: reviews.filter((r) => r.isHidden).length,
      byRating,
    };
  },

  // Get recent reviews (for dashboard)
  async getRecentReviews(limit: number = 10): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .slice(0, limit)
      .map((doc) => this.transformReview(doc.id, doc.data()));
  },

  // Get flagged/pending reviews
  async getPendingReviews(): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      where('isApproved', '==', false),
      where('isHidden', '==', false),
      orderBy('createdAt', 'desc')
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => this.transformReview(doc.id, doc.data()));
    } catch {
      // If index doesn't exist, fallback to client-side filtering
      const allReviews = await this.getReviews();
      return allReviews.filter((r) => !r.isApproved && !r.isHidden);
    }
  },

  // Transform Firestore data to Review type
  transformReview(id: string, data: DocumentData): Review {
    return {
      id,
      userId: data.userId || '',
      userName: data.userName || 'Anonymous',
      userPhotoUrl: data.userPhotoUrl,
      targetId: data.targetId || '',
      targetType: data.targetType || 'product',
      rating: data.rating || 0,
      comment: data.comment,
      imageUrls: data.imageUrls || [],
      isApproved: data.isApproved ?? true, // Default to approved for backward compatibility
      isHidden: data.isHidden ?? false,
      createdAt: parseFirestoreDate(data.createdAt) || new Date(),
      updatedAt: parseFirestoreDate(data.updatedAt) || new Date(),
    };
  },
};
