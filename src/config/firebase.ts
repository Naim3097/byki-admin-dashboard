// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration for BYKI (oxhub-42c99)
const firebaseConfig = {
  apiKey: "AIzaSyBkYbWweI3F_Zulo35_bhpeOcodURbFMXA",
  authDomain: "oxhub-42c99.firebaseapp.com",
  projectId: "oxhub-42c99",
  storageBucket: "oxhub-42c99.firebasestorage.app",
  messagingSenderId: "319585203062",
  appId: "1:319585203062:web:759b5a25e533ff65b3c057",
};

// Verify configuration
if (!firebaseConfig.projectId) {
  console.error('Firebase configuration missing. Check your .env file.');
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Log connection for debugging
console.log(`Firebase connected to project: ${firebaseConfig.projectId}`);

export default app;
