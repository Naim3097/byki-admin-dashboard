// Workshops Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Workshop } from '../types/workshop';
import { parseFirestoreDate } from '../utils/helpers';

export const workshopsService = {
  // Get all workshops
  async getWorkshops(): Promise<Workshop[]> {
    try {
      const q = query(collection(db, 'workshops'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => this.transformWorkshop(doc.id, doc.data()));
    } catch (error) {
      // Fallback: query without ordering if index doesn't exist
      console.warn('Workshops query with ordering failed, trying without order:', error);
      const snapshot = await getDocs(collection(db, 'workshops'));
      const workshops = snapshot.docs.map((doc) => this.transformWorkshop(doc.id, doc.data()));
      // Sort client-side by name
      return workshops.sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  // Get single workshop
  async getWorkshop(workshopId: string): Promise<Workshop | null> {
    const docSnap = await getDoc(doc(db, 'workshops', workshopId));
    if (!docSnap.exists()) return null;
    return this.transformWorkshop(docSnap.id, docSnap.data());
  },

  // Create workshop
  async createWorkshop(workshop: Omit<Workshop, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'workshops'), {
      ...workshop,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Update workshop
  async updateWorkshop(workshopId: string, updates: Partial<Workshop>): Promise<void> {
    const docRef = doc(db, 'workshops', workshopId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete workshop
  async deleteWorkshop(workshopId: string): Promise<void> {
    await deleteDoc(doc(db, 'workshops', workshopId));
  },

  // Toggle workshop active status
  async toggleWorkshopStatus(workshopId: string, isActive: boolean): Promise<void> {
    const docRef = doc(db, 'workshops', workshopId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: Timestamp.now(),
    });
  },

  // Transform Firestore data to Workshop type
  transformWorkshop(id: string, data: DocumentData): Workshop {
    // Handle working hours - support both new format and legacy operatingHours
    const defaultWorkingHours = {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '9:00 AM - 2:00 PM',
      sunday: 'Closed',
    };

    return {
      id,
      name: data.name || '',
      address: data.address || '',
      city: data.city,
      state: data.state,
      postcode: data.postcode,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      phone: data.phone || '',
      whatsapp: data.whatsapp,
      email: data.email,
      website: data.website,
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      amenities: data.amenities || [],
      workingHours: data.workingHours || defaultWorkingHours,
      services: data.services || [],
      specializations: data.specializations || [],
      imageUrl: data.imageUrl,
      galleryImages: data.galleryImages,
      isActive: data.isActive ?? true,
      createdAt: parseFirestoreDate(data.createdAt),
      partnerType: data.partnerType || 'partner',
      region: data.region || 'klangValley',
      isHQ: data.isHQ ?? false,
      googleMapsUrl: data.googleMapsUrl,
      googlePlaceId: data.googlePlaceId,
      coverageAreas: data.coverageAreas || [],
      maxDailyBookings: data.maxDailyBookings || 10,
      supportedCategories: data.supportedCategories || ['Oil', 'Brakes', 'Filters', 'Battery', 'Tires'],
    };
  },
};
