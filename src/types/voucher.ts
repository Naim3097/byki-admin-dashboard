// Voucher Types - Aligned with Mobile App

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discountValue: number;
  isPercentage: boolean;
  minSpend?: number;
  maxDiscount?: number;
  applicableCategories?: string[];
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  pointsCost: number;
}

export interface UserVoucher {
  id: string;
  userId: string;
  voucherId: string;
  isUsed: boolean;
  usedInOrderId?: string;
  usedAt?: Date;
  claimedAt: Date;
}
