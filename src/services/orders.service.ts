// Orders Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, OrderStatus, OrderStats } from '../types/order';
import { parseFirestoreDate } from '../utils/helpers';

export const ordersService = {
  // Get all orders with filters
  async getOrders(filters?: {
    status?: OrderStatus;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<Order[]> {
    let orders: Order[] = [];
    
    try {
      let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

      if (filters?.limit) {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(filters.limit));
      }

      if (filters?.status) {
        q = query(
          collection(db, 'orders'),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.userId) {
        q = query(
          collection(db, 'orders'),
          where('userId', '==', filters.userId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      orders = snapshot.docs.map((doc) => this.transformOrder(doc.id, doc.data()));
    } catch (error) {
      console.warn('Orders query with ordering failed, trying without order:', error);
      const snapshot = await getDocs(collection(db, 'orders'));
      orders = snapshot.docs.map((doc) => this.transformOrder(doc.id, doc.data()));
      
      // Apply filters client-side
      if (filters?.status) {
        orders = orders.filter(o => o.status === filters.status);
      }
      if (filters?.userId) {
        orders = orders.filter(o => o.userId === filters.userId);
      }
      
      // Sort by createdAt descending
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Apply limit
      if (filters?.limit) {
        orders = orders.slice(0, filters.limit);
      }
    }

    // Client-side date filtering
    if (filters?.startDate) {
      orders = orders.filter((o) => o.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      orders = orders.filter((o) => o.createdAt <= filters.endDate!);
    }

    return orders;
  },

  // Get single order
  async getOrder(orderId: string): Promise<Order | null> {
    const docSnap = await getDoc(doc(db, 'orders', orderId));
    if (!docSnap.exists()) return null;
    return this.transformOrder(docSnap.id, docSnap.data());
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  },

  // Update order
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Get order stats for a date
  async getOrderStats(date: Date): Promise<OrderStats> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay))
    );

    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((doc) => doc.data());

    return {
      total: orders.length,
      pending: orders.filter(
        (o) => o.status === 'pendingPayment' || o.status === 'confirmed'
      ).length,
      completed: orders.filter((o) => o.status === 'completed').length,
      revenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    };
  },

  // Get revenue stats for a period
  async getRevenueStats(days: number = 30): Promise<{ date: string; revenue: number; orders: number }[]> {
    // const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('status', 'in', ['completed', 'confirmed', 'inProgress']),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((doc) => ({
      date: doc.data().createdAt?.toDate(),
      total: doc.data().total || 0,
    }));

    // Group by date
    const grouped = orders.reduce(
      (acc, order) => {
        const dateStr = order.date?.toISOString().split('T')[0];
        if (dateStr) {
          if (!acc[dateStr]) {
            acc[dateStr] = { revenue: 0, orders: 0 };
          }
          acc[dateStr].revenue += order.total;
          acc[dateStr].orders += 1;
        }
        return acc;
      },
      {} as Record<string, { revenue: number; orders: number }>
    );

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));
  },

  // Transform Firestore data to Order type
  transformOrder(id: string, data: DocumentData): Order {
    // Transform items with backward compatibility for field names
    const items = (data.items || []).map((item: Record<string, unknown>) => ({
      productId: item.productId || '',
      productName: item.productName || '',
      quantity: item.quantity || 0,
      // Handle both new (unitPrice) and old (price) field names
      unitPrice: item.unitPrice ?? item.price ?? 0,
      // Handle both new (totalPrice) and old (subtotal) field names
      totalPrice: item.totalPrice ?? item.subtotal ?? 0,
      imageUrl: item.imageUrl,
    }));

    return {
      id,
      userId: data.userId,
      orderNumber: data.orderNumber || id.slice(0, 8).toUpperCase(),
      items,
      subtotal: data.subtotal || 0,
      discount: data.discount || 0,
      tax: data.tax || 0,
      total: data.total || 0,
      status: data.status || 'pendingPayment',
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      workshopId: data.workshopId,
      bookingId: data.bookingId,
      voucherId: data.voucherId,
      notes: data.notes,
      createdAt: parseFirestoreDate(data.createdAt),
      updatedAt: parseFirestoreDate(data.updatedAt),
    };
  },
};
