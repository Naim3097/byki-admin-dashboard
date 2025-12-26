// Workshop Types - Aligned with Mobile App

export interface Workshop {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  workingHours: WorkingHours;
  services: string[];
  specializations: string[];
  imageUrl?: string;
  galleryImages?: string[];
  isActive: boolean;
  createdAt: Date;
  partnerType: WorkshopPartnerType;
  region: ServiceRegion;
  isHQ: boolean;
  googleMapsUrl?: string;
  googlePlaceId?: string;
  coverageAreas: string[];
  maxDailyBookings: number;
  supportedCategories: string[];
}

export type WorkshopPartnerType = 'hq' | 'partner' | 'affiliate';

export type ServiceRegion = 'klangValley' | 'northern' | 'southern' | 'eastCoast' | 'eastMalaysia';

export interface WorkingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

// Legacy type for backward compatibility with old admin components
export interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface WorkshopTimeSlot {
  date: string;
  slots: TimeSlotDetail[];
}

export interface TimeSlotDetail {
  time: string;
  capacity: number;
  booked: number;
  available: boolean;
}
