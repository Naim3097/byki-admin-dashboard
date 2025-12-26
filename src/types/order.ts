// Order Types - Aligned with Mobile App

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  workshopId?: string;
  bookingId?: string;
  voucherId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export type OrderStatus =
  | 'pendingPayment'
  | 'confirmed'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'creditCard'
  | 'debitCard'
  | 'eWallet'
  | 'bnpl'
  | 'cash';

export interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  revenue: number;
}
