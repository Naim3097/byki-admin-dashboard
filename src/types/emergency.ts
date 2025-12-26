// Emergency Types - Aligned with Mobile App

export interface EmergencyRequest {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  vehicleId?: string;
  vehicleInfo?: string;
  type: EmergencyType;
  status: EmergencyStatus;
  latitude: number;
  longitude: number;
  address: string;
  description?: string;
  mechanicId?: string;
  mechanicName?: string;
  estimatedArrival?: Date;
  dispatchedAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EmergencyType =
  | 'breakdown'
  | 'accident'
  | 'flatTire'
  | 'battery'
  | 'fuel'
  | 'lockout'
  | 'other';

export type EmergencyStatus =
  | 'pending'
  | 'dispatched'
  | 'enRoute'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export interface EmergencyStats {
  total: number;
  pending: number;
  active: number;
  completedToday: number;
  averageResponseTime: number; // in minutes
}
