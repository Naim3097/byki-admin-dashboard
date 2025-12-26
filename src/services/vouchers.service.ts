// Vouchers Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Voucher } from '../types/voucher';
import { parseFirestoreDate } from '../utils/helpers';

export const vouchersService = {
  // Get all vouchers
  async getVouchers(): Promise<Voucher[]> {
    const q = query(collection(db, 'vouchers'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.transformVoucher(doc.id, doc.data()));
  },

  // Get single voucher
  async getVoucher(voucherId: string): Promise<Voucher | null> {
    const docSnap = await getDoc(doc(db, 'vouchers', voucherId));
    if (!docSnap.exists()) return null;
    return this.transformVoucher(docSnap.id, docSnap.data());
  },

  // Create voucher
  async createVoucher(voucher: Omit<Voucher, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'vouchers'), {
      ...voucher,
      validFrom: Timestamp.fromDate(voucher.validFrom),
      validUntil: Timestamp.fromDate(voucher.validUntil),
    });
    return docRef.id;
  },

  // Update voucher
  async updateVoucher(voucherId: string, updates: Partial<Voucher>): Promise<void> {
    const docRef = doc(db, 'vouchers', voucherId);
    const updateData: Record<string, unknown> = { ...updates };
    
    if (updates.validFrom) {
      updateData.validFrom = Timestamp.fromDate(updates.validFrom);
    }
    if (updates.validUntil) {
      updateData.validUntil = Timestamp.fromDate(updates.validUntil);
    }
    
    await updateDoc(docRef, updateData);
  },

  // Delete voucher
  async deleteVoucher(voucherId: string): Promise<void> {
    await deleteDoc(doc(db, 'vouchers', voucherId));
  },

  // Toggle voucher active status
  async toggleVoucherStatus(voucherId: string, isActive: boolean): Promise<void> {
    const docRef = doc(db, 'vouchers', voucherId);
    await updateDoc(docRef, { isActive });
  },

  // Get voucher stats
  async getVoucherStats(): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    const vouchers = await this.getVouchers();
    const now = new Date();

    return {
      total: vouchers.length,
      active: vouchers.filter((v) => v.isActive && v.validUntil > now).length,
      expired: vouchers.filter((v) => v.validUntil <= now).length,
    };
  },

  // Transform Firestore data to Voucher type
  transformVoucher(id: string, data: DocumentData): Voucher {
    // Handle both new field names and legacy field names for backward compatibility
    const isPercentage = data.isPercentage ?? (data.discountType === 'percentage');
    
    return {
      id,
      code: data.code || '',
      title: data.title || data.name || '',
      description: data.description || '',
      discountValue: data.discountValue || 0,
      isPercentage,
      minSpend: data.minSpend ?? data.minPurchase,
      maxDiscount: data.maxDiscount,
      applicableCategories: data.applicableCategories,
      validFrom: parseFirestoreDate(data.validFrom),
      validUntil: parseFirestoreDate(data.validUntil),
      isActive: data.isActive ?? true,
      pointsCost: data.pointsCost || 0,
    };
  },
};
