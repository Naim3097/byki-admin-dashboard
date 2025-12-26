// Product Types

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number;
  imageUrls: string[];
  specifications: Record<string, string>;
  compatibleWith: string[];
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  specificationFields?: SpecificationField[];
}

export interface SpecificationField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
  required?: boolean;
}

export interface ProductBundle {
  id: string;
  name: string;
  description: string;
  items: BundleItem[];
  totalPrice: number;
  originalTotalPrice?: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
}

export interface BundleItem {
  productId: string;
  productName: string;
  quantity: number;
  isOptional: boolean;
  alternatives?: string[];
}

export interface InventoryStats {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  byCategory: Record<string, number>;
}
