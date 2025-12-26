// Helper Functions

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Debounce function
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Calculate percentage change
export const calculatePercentageChange = (
  oldValue: number,
  newValue: number
): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Group array by key
export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
};

// Sort array by key
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// Download data as JSON file
export const downloadAsJson = (data: object, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Download data as CSV file
export const downloadAsCsv = (data: object[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, unknown>)[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// Sleep/delay function
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Parse various date formats from Firestore (Timestamp, string, number, etc.)
export const parseFirestoreDate = (value: unknown): Date => {
  if (!value) return new Date();
  // Firestore Timestamp with toDate method
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  // Already a Date
  if (value instanceof Date) return value;
  // String (ISO format or other)
  if (typeof value === 'string') return new Date(value);
  // Number (Unix timestamp in ms or seconds)
  if (typeof value === 'number') {
    // If it's in seconds (Unix), convert to ms
    return value < 10000000000 ? new Date(value * 1000) : new Date(value);
  }
  // Firestore Timestamp-like object with seconds/nanoseconds
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return new Date();
};
