// Formatters
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Date formatting
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY');
};

export const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

export const formatTime = (date: Date | string | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format('HH:mm');
};

export const formatRelativeTime = (date: Date | string | undefined): string => {
  if (!date) return '-';
  return dayjs(date).fromNow();
};

// Currency formatting
export const formatCurrency = (
  amount: number,
  currency: string = 'MYR'
): string => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatRM = (amount: number): string => {
  return `RM ${amount.toFixed(2)}`;
};

// Number formatting
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-MY').format(num);
};

export const formatCompactNumber = (num: number): string => {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(num);
};

// Phone formatting
export const formatPhone = (phone: string | undefined): string => {
  if (!phone) return '-';
  // Format Malaysian phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('60')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Order number formatting
export const formatOrderNumber = (orderId: string): string => {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
};
