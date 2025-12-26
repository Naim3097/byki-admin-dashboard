// Support Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  // addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SupportTicket, TicketStatus, TicketMessage, TicketStats } from '../types/support';
import { parseFirestoreDate } from '../utils/helpers';

export const supportService = {
  // Get all tickets with filters
  async getTickets(filters?: {
    status?: TicketStatus;
    userId?: string;
    assignedTo?: string;
  }): Promise<SupportTicket[]> {
    let tickets: SupportTicket[] = [];
    
    try {
      let q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));

      if (filters?.status) {
        q = query(
          collection(db, 'support_tickets'),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.userId) {
        q = query(
          collection(db, 'support_tickets'),
          where('userId', '==', filters.userId),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.assignedTo) {
        q = query(
          collection(db, 'support_tickets'),
          where('assignedTo', '==', filters.assignedTo),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      tickets = snapshot.docs.map((doc) => this.transformTicket(doc.id, doc.data()));
    } catch (error) {
      console.warn('Support tickets query with ordering failed, trying without order:', error);
      const snapshot = await getDocs(collection(db, 'support_tickets'));
      tickets = snapshot.docs.map((doc) => this.transformTicket(doc.id, doc.data()));
      
      // Apply filters client-side
      if (filters?.status) {
        tickets = tickets.filter(t => t.status === filters.status);
      }
      if (filters?.userId) {
        tickets = tickets.filter(t => t.userId === filters.userId);
      }
      if (filters?.assignedTo) {
        tickets = tickets.filter(t => t.assignedTo === filters.assignedTo);
      }
      
      // Sort by createdAt descending
      tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // Enrich with user data if userName is missing
    return this.enrichWithUserData(tickets);
  },

  // Get single ticket
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    const docSnap = await getDoc(doc(db, 'support_tickets', ticketId));
    if (!docSnap.exists()) return null;
    return this.transformTicket(docSnap.id, docSnap.data());
  },

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    const docRef = doc(db, 'support_tickets', ticketId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (status === 'resolved') {
      updateData.resolvedAt = Timestamp.now();
    }

    await updateDoc(docRef, updateData);
  },

  // Assign ticket to staff
  async assignTicket(ticketId: string, staffId: string): Promise<void> {
    const docRef = doc(db, 'support_tickets', ticketId);
    await updateDoc(docRef, {
      assignedTo: staffId,
      status: 'inProgress',
      updatedAt: Timestamp.now(),
    });
  },

  // Add reply to ticket
  async addReply(
    ticketId: string,
    message: Omit<TicketMessage, 'id' | 'createdAt'>
  ): Promise<void> {
    const docRef = doc(db, 'support_tickets', ticketId);
    const newMessage: TicketMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      createdAt: new Date(),
    };

    await updateDoc(docRef, {
      messages: arrayUnion({
        ...newMessage,
        createdAt: Timestamp.now(),
      }),
      updatedAt: Timestamp.now(),
    });
  },

  // Get ticket stats
  async getTicketStats(): Promise<TicketStats> {
    const snapshot = await getDocs(collection(db, 'support_tickets'));
    const tickets = snapshot.docs.map((doc) => doc.data());

    // Calculate average resolution time
    const resolvedTickets = tickets.filter((t) => t.resolvedAt && t.createdAt);
    const avgResolutionTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
            const created = t.createdAt?.toDate?.()?.getTime() || 0;
            const resolved = t.resolvedAt?.toDate?.()?.getTime() || 0;
            return sum + (resolved - created) / (1000 * 60 * 60); // in hours
          }, 0) / resolvedTickets.length
        : 0;

    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'inProgress').length,
      resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
      averageResolutionTime: Math.round(avgResolutionTime),
    };
  },

  // Transform Firestore data to SupportTicket type
  transformTicket(id: string, data: DocumentData): SupportTicket {
    return {
      id,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      subject: data.subject || '',
      message: data.message || '',
      status: data.status || 'open',
      priority: data.priority || 'medium',
      category: data.category,
      assignedTo: data.assignedTo,
      messages: data.messages?.map((m: DocumentData) => ({
        ...m,
        createdAt: parseFirestoreDate(m.createdAt),
      })),
      createdAt: parseFirestoreDate(data.createdAt),
      updatedAt: data.updatedAt ? parseFirestoreDate(data.updatedAt) : undefined,
      resolvedAt: data.resolvedAt ? parseFirestoreDate(data.resolvedAt) : undefined,
    };
  },

  // Enrich tickets with user data from users collection
  async enrichWithUserData(tickets: SupportTicket[]): Promise<SupportTicket[]> {
    // Get unique user IDs that need enrichment
    const userIdsToFetch = [...new Set(
      tickets
        .filter(t => t.userId && !t.userName && !t.userEmail)
        .map(t => t.userId)
    )];

    if (userIdsToFetch.length === 0) {
      return tickets;
    }

    // Fetch user data
    const userDataMap = new Map<string, { name: string; email?: string }>();
    
    await Promise.all(
      userIdsToFetch.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userDataMap.set(userId, {
              name: userData.name || userData.displayName || 'User',
              email: userData.email,
            });
          }
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
        }
      })
    );

    // Enrich tickets with user data
    return tickets.map(ticket => {
      if (!ticket.userName && !ticket.userEmail && ticket.userId && userDataMap.has(ticket.userId)) {
        const userData = userDataMap.get(ticket.userId)!;
        return {
          ...ticket,
          userName: userData.name,
          userEmail: ticket.userEmail || userData.email,
        };
      }
      return ticket;
    });
  },
};
