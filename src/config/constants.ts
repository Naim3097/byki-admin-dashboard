// App Constants

export const APP_NAME = 'BYKI Admin Dashboard';
export const APP_VERSION = '1.0.0';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date formats
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Order statuses
export const ORDER_STATUSES = {
  pendingPayment: { label: 'Pending Payment', color: 'orange' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  inProgress: { label: 'In Progress', color: 'processing' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
  refunded: { label: 'Refunded', color: 'default' },
} as const;

// Booking statuses
export const BOOKING_STATUSES = {
  pending: { label: 'Pending', color: 'orange' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  inProgress: { label: 'In Progress', color: 'processing' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
  noShow: { label: 'No Show', color: 'error' },
} as const;

// Emergency statuses
export const EMERGENCY_STATUSES = {
  pending: { label: 'Pending', color: 'error' },
  dispatched: { label: 'Dispatched', color: 'blue' },
  enRoute: { label: 'En Route', color: 'cyan' },
  arrived: { label: 'Arrived', color: 'green' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
} as const;

// Support ticket statuses
export const TICKET_STATUSES = {
  open: { label: 'Open', color: 'orange' },
  inProgress: { label: 'In Progress', color: 'processing' },
  resolved: { label: 'Resolved', color: 'success' },
  closed: { label: 'Closed', color: 'default' },
} as const;

// User roles
export const USER_ROLES = {
  user: { label: 'User', color: 'default' },
  staff: { label: 'Staff', color: 'blue' },
  admin: { label: 'Admin', color: 'purple' },
  superAdmin: { label: 'Super Admin', color: 'red' },
} as const;

// Product categories
export const PRODUCT_CATEGORIES = [
  'Oil',
  'Tires',
  'Battery',
  'Brakes',
  'Filters',
  'Service',
  'Accessories',
  'Parts',
] as const;

// Loyalty tiers
export const LOYALTY_TIERS = {
  bronze: { label: 'Bronze', color: '#CD7F32', minPoints: 0 },
  silver: { label: 'Silver', color: '#C0C0C0', minPoints: 1000 },
  gold: { label: 'Gold', color: '#FFD700', minPoints: 5000 },
  platinum: { label: 'Platinum', color: '#E5E4E2', minPoints: 10000 },
} as const;

// Low stock threshold
export const LOW_STOCK_THRESHOLD = 10;

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
