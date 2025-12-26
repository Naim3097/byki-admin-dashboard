// User Types - Aligned with Mobile App

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImageUrl?: string;
  role: UserRole;
  deviceTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  // Admin-only fields
  status?: UserStatus;
  suspendedAt?: Date;
  suspensionReason?: string;
  bannedAt?: Date;
  banReason?: string;
}

export type UserRole = 'user' | 'staff' | 'admin' | 'superAdmin';

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: 'staff' | 'admin' | 'superAdmin';
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  variant: string;
  licensePlate?: string;
  isPrimary: boolean;
  specs?: VehicleSpecs;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleSpecs {
  tireSize?: string;
  oilType?: string;
  oilCapacity?: string;
  batteryModel?: string;
  wiperSize?: string;
  engineType?: string;
  transmission?: string;
  fuelType?: string;
}

export interface LoyaltyAccount {
  userId: string;
  totalPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  createdAt: Date;
  updatedAt: Date;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  type: PointsTransactionType;
  orderId?: string;
  description?: string;
  createdAt: Date;
}

export type PointsTransactionType = 'earned' | 'redeemed' | 'expired' | 'adjusted';
