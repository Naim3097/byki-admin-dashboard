// Real-time Hooks
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export function useRealtimeCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  transform?: (data: Record<string, unknown>) => T
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const docData = { id: doc.id, ...doc.data() };
          return transform ? transform(docData) : (docData as T);
        });
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}

// Real-time active emergencies
export function useActiveEmergencies() {
  return useRealtimeCollection(
    'emergency_requests',
    [
      where('status', 'in', ['pending', 'dispatched', 'enRoute', 'arrived']),
      orderBy('createdAt', 'desc'),
    ]
  );
}

// Real-time today's orders
export function useTodayOrders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useRealtimeCollection(
    'orders',
    [
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc'),
    ]
  );
}

// Real-time pending support tickets
export function usePendingTickets() {
  return useRealtimeCollection(
    'support_tickets',
    [
      where('status', 'in', ['open', 'inProgress']),
      orderBy('createdAt', 'desc'),
    ]
  );
}
