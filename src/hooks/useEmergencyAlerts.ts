// Emergency Alerts Hook
import { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useEmergencyAlerts() {
  const previousCount = useRef(0);

  useEffect(() => {
    const q = query(
      collection(db, 'emergency_requests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentCount = snapshot.docs.length;

      // New emergency came in
      if (currentCount > previousCount.current && previousCount.current !== 0) {
        // Show notification
        notification.error({
          message: '🚨 NEW EMERGENCY!',
          description: 'A user has requested emergency assistance.',
          duration: 0, // Don't auto-close
          placement: 'topRight',
        });

        // Play alert sound if available
        try {
          const audio = new Audio('/sounds/emergency-alert.mp3');
          audio.play().catch(() => {
            // Audio play failed, likely due to browser autoplay policy
          });
        } catch {
          // Audio not available
        }
      }

      previousCount.current = currentCount;
    });

    return () => unsubscribe();
  }, []);
}
