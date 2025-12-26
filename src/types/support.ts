// Support Types

export interface SupportTicket {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  assignedTo?: string;
  messages?: TicketMessage[];
  createdAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
}

export type TicketStatus = 'open' | 'inProgress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  averageResolutionTime: number; // in hours
}
