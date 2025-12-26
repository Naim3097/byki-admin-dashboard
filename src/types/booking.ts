// Booking Types - Aligned with Mobile App

export interface Booking {
  id: string;
  userId: string;
  workshopId: string;
  workshopName?: string;
  orderId?: string;
  appointmentDate: Date;
  timeSlot: string;
  status: BookingStatus;
  vehicleId?: string;
  services: string[];
  notes?: string;
  cancellationFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'noShow';

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  bookedBy?: string;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  todayBookings: number;
}
