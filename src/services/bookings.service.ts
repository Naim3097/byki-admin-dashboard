// Bookings Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Booking, BookingStatus, BookingStats } from '../types/booking';
import { parseFirestoreDate } from '../utils/helpers';

export const bookingsService = {
  // Get all bookings with filters
  async getBookings(filters?: {
    status?: BookingStatus;
    userId?: string;
    workshopId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Booking[]> {
    let bookings: Booking[] = [];
    
    try {
      let q = query(collection(db, 'bookings'), orderBy('appointmentDate', 'desc'));

      if (filters?.status) {
        q = query(
          collection(db, 'bookings'),
          where('status', '==', filters.status),
          orderBy('appointmentDate', 'desc')
        );
      }

      if (filters?.workshopId) {
        q = query(
          collection(db, 'bookings'),
          where('workshopId', '==', filters.workshopId),
          orderBy('appointmentDate', 'desc')
        );
      }

      if (filters?.userId) {
        q = query(
          collection(db, 'bookings'),
          where('userId', '==', filters.userId),
          orderBy('appointmentDate', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      bookings = snapshot.docs.map((doc) => this.transformBooking(doc.id, doc.data()));
    } catch (error) {
      console.warn('Bookings query with ordering failed, trying without order:', error);
      const snapshot = await getDocs(collection(db, 'bookings'));
      bookings = snapshot.docs.map((doc) => this.transformBooking(doc.id, doc.data()));
      
      // Apply filters client-side
      if (filters?.status) {
        bookings = bookings.filter(b => b.status === filters.status);
      }
      if (filters?.workshopId) {
        bookings = bookings.filter(b => b.workshopId === filters.workshopId);
      }
      if (filters?.userId) {
        bookings = bookings.filter(b => b.userId === filters.userId);
      }
      
      // Sort by appointmentDate descending
      bookings.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    }

    // Client-side date filtering
    if (filters?.startDate) {
      bookings = bookings.filter((b) => b.appointmentDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      bookings = bookings.filter((b) => b.appointmentDate <= filters.endDate!);
    }

    return bookings;
  },

  // Get single booking
  async getBooking(bookingId: string): Promise<Booking | null> {
    const docSnap = await getDoc(doc(db, 'bookings', bookingId));
    if (!docSnap.exists()) return null;
    return this.transformBooking(docSnap.id, docSnap.data());
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
    const docRef = doc(db, 'bookings', bookingId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  },

  // Reschedule booking
  async rescheduleBooking(
    bookingId: string,
    newDate: Date,
    newTimeSlot: string
  ): Promise<void> {
    const docRef = doc(db, 'bookings', bookingId);
    await updateDoc(docRef, {
      appointmentDate: Timestamp.fromDate(newDate),
      timeSlot: newTimeSlot,
      updatedAt: Timestamp.now(),
    });
  },

  // Get today's bookings
  async getTodayBookings(): Promise<Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      collection(db, 'bookings'),
      where('appointmentDate', '>=', Timestamp.fromDate(today)),
      where('appointmentDate', '<', Timestamp.fromDate(tomorrow)),
      orderBy('appointmentDate', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.transformBooking(doc.id, doc.data()));
  },

  // Get booking stats
  async getBookingStats(): Promise<BookingStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all bookings
    const allSnapshot = await getDocs(collection(db, 'bookings'));
    const allBookings = allSnapshot.docs.map((doc) => doc.data());

    // Get today's bookings
    const todayQ = query(
      collection(db, 'bookings'),
      where('appointmentDate', '>=', Timestamp.fromDate(today)),
      where('appointmentDate', '<', Timestamp.fromDate(tomorrow))
    );
    const todaySnapshot = await getDocs(todayQ);

    return {
      total: allBookings.length,
      pending: allBookings.filter((b) => b.status === 'pending').length,
      confirmed: allBookings.filter((b) => b.status === 'confirmed').length,
      completed: allBookings.filter((b) => b.status === 'completed').length,
      todayBookings: todaySnapshot.size,
    };
  },

  // Transform Firestore data to Booking type
  transformBooking(id: string, data: DocumentData): Booking {
    return {
      id,
      userId: data.userId,
      workshopId: data.workshopId,
      workshopName: data.workshopName,
      orderId: data.orderId,
      appointmentDate: parseFirestoreDate(data.appointmentDate),
      timeSlot: data.timeSlot || '',
      status: data.status || 'pending',
      vehicleId: data.vehicleId,
      services: data.services || [],
      notes: data.notes,
      cancellationFee: data.cancellationFee,
      createdAt: parseFirestoreDate(data.createdAt),
      updatedAt: parseFirestoreDate(data.updatedAt),
    };
  },
};
