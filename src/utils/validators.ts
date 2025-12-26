// Validators

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Malaysian)
export const isValidMalaysianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  // Malaysian mobile: 01X-XXXXXXX (10-11 digits)
  // With country code: 601X-XXXXXXX (11-12 digits)
  return /^(60)?1[0-9]{8,9}$/.test(cleaned);
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

// Price validation
export const isValidPrice = (price: number): boolean => {
  return price >= 0 && Number.isFinite(price);
};

// Stock quantity validation
export const isValidStock = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity >= 0;
};

// Voucher code validation
export const isValidVoucherCode = (code: string): boolean => {
  // Alphanumeric, uppercase, 4-20 characters
  return /^[A-Z0-9]{4,20}$/.test(code.toUpperCase());
};

// Date range validation
export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate;
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Image file validation
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  return validTypes.includes(file.type) && file.size <= maxSize;
};
