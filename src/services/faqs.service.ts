// FAQs Service - For Admin Dashboard
// Aligned with Mobile App's FAQ system
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FAQ, FAQCategory } from '../types/review';
import { parseFirestoreDate } from '../utils/helpers';

export const faqsService = {
  // ============ FAQs ============

  // Get all FAQs
  async getFAQs(filters?: {
    category?: string;
    isActive?: boolean;
  }): Promise<FAQ[]> {
    try {
      let q = query(collection(db, 'faqs'), orderBy('sortOrder', 'asc'));

      if (filters?.category) {
        q = query(
          collection(db, 'faqs'),
          where('category', '==', filters.category),
          orderBy('sortOrder', 'asc')
        );
      }

      if (filters?.isActive !== undefined) {
        q = query(
          collection(db, 'faqs'),
          where('isActive', '==', filters.isActive),
          orderBy('sortOrder', 'asc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => this.transformFAQ(doc.id, doc.data()));
    } catch (error) {
      console.warn('FAQs query with ordering failed, trying without order:', error);
      const snapshot = await getDocs(collection(db, 'faqs'));
      let faqs = snapshot.docs.map((doc) => this.transformFAQ(doc.id, doc.data()));
      
      // Apply filters client-side
      if (filters?.category) {
        faqs = faqs.filter(f => f.category === filters.category);
      }
      if (filters?.isActive !== undefined) {
        faqs = faqs.filter(f => f.isActive === filters.isActive);
      }
      
      // Sort by sortOrder client-side
      return faqs.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  },

  // Get single FAQ
  async getFAQ(faqId: string): Promise<FAQ | null> {
    const docSnap = await getDoc(doc(db, 'faqs', faqId));
    if (!docSnap.exists()) return null;
    return this.transformFAQ(docSnap.id, docSnap.data());
  },

  // Create FAQ
  async createFAQ(faq: Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'faqs'), {
      ...faq,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Update FAQ
  async updateFAQ(faqId: string, updates: Partial<FAQ>): Promise<void> {
    const docRef = doc(db, 'faqs', faqId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete FAQ
  async deleteFAQ(faqId: string): Promise<void> {
    await deleteDoc(doc(db, 'faqs', faqId));
  },

  // Toggle FAQ active status
  async toggleFAQStatus(faqId: string, isActive: boolean): Promise<void> {
    const docRef = doc(db, 'faqs', faqId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: Timestamp.now(),
    });
  },

  // Reorder FAQs
  async reorderFAQs(faqOrders: { id: string; sortOrder: number }[]): Promise<void> {
    const promises = faqOrders.map(({ id, sortOrder }) =>
      updateDoc(doc(db, 'faqs', id), { sortOrder })
    );
    await Promise.all(promises);
  },

  // ============ FAQ CATEGORIES ============

  // Get all FAQ categories
  async getCategories(): Promise<FAQCategory[]> {
    try {
      const q = query(collection(db, 'faq_categories'), orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FAQCategory[];
    } catch (error) {
      console.warn('FAQ categories query failed, trying without order:', error);
      const snapshot = await getDocs(collection(db, 'faq_categories'));
      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FAQCategory[];
      return categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
  },

  // Create FAQ category
  async createCategory(category: Omit<FAQCategory, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'faq_categories'), category);
    return docRef.id;
  },

  // Update FAQ category
  async updateCategory(categoryId: string, updates: Partial<FAQCategory>): Promise<void> {
    await updateDoc(doc(db, 'faq_categories', categoryId), updates);
  },

  // Delete FAQ category
  async deleteCategory(categoryId: string): Promise<void> {
    await deleteDoc(doc(db, 'faq_categories', categoryId));
  },

  // Get FAQ stats
  async getFAQStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<string, number>;
  }> {
    const faqs = await this.getFAQs();

    const byCategory = faqs.reduce(
      (acc, faq) => {
        acc[faq.category] = (acc[faq.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: faqs.length,
      active: faqs.filter((f) => f.isActive).length,
      byCategory,
    };
  },

  // Transform Firestore data to FAQ type
  transformFAQ(id: string, data: DocumentData): FAQ {
    return {
      id,
      question: data.question || '',
      answer: data.answer || '',
      category: data.category || 'General',
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive ?? true,
      createdAt: parseFirestoreDate(data.createdAt),
      updatedAt: parseFirestoreDate(data.updatedAt),
    };
  },
};
