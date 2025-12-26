// Products Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Product, ProductCategory, InventoryStats } from '../types/product';
import { LOW_STOCK_THRESHOLD } from '../config/constants';
import { parseFirestoreDate } from '../utils/helpers';

export const productsService = {
  // ============ PRODUCTS ============

  // Get all products with filters
  async getProducts(filters?: {
    category?: string;
    brand?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Product[]> {
    let products: Product[] = [];
    
    console.log('[ProductsService] Fetching products...');
    
    try {
      // Try with ordering first
      let q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));

      if (filters?.category) {
        q = query(
          collection(db, 'products'),
          where('category', '==', filters.category),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      console.log('[ProductsService] Got snapshot with', snapshot.docs.length, 'docs (ordered)');
      products = snapshot.docs.map((doc) => this.transformProduct(doc.id, doc.data()));
    } catch (error) {
      // Fallback: query without ordering if index doesn't exist
      console.warn('[ProductsService] Ordered query failed, trying without order:', error);
      
      let q = filters?.category 
        ? query(collection(db, 'products'), where('category', '==', filters.category))
        : query(collection(db, 'products'));
      
      const snapshot = await getDocs(q);
      console.log('[ProductsService] Got snapshot with', snapshot.docs.length, 'docs (unordered)');
      products = snapshot.docs.map((doc) => this.transformProduct(doc.id, doc.data()));
      
      // Sort client-side
      products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    console.log('[ProductsService] Returning', products.length, 'products');

    // Client-side filtering for additional filters
    if (filters?.brand) {
      products = products.filter((p) => p.brand === filters.brand);
    }
    if (filters?.inStock !== undefined) {
      products = products.filter((p) => p.inStock === filters.inStock);
    }
    if (filters?.minPrice) {
      products = products.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters?.maxPrice) {
      products = products.filter((p) => p.price <= filters.maxPrice!);
    }

    return products;
  },

  // Get single product
  async getProduct(productId: string): Promise<Product | null> {
    const docSnap = await getDoc(doc(db, 'products', productId));
    if (!docSnap.exists()) return null;
    return this.transformProduct(docSnap.id, docSnap.data());
  },

  // Create product
  async createProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Update product
  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  },

  // Update stock quantity
  async updateStock(productId: string, quantity: number): Promise<void> {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      stockQuantity: quantity,
      inStock: quantity > 0,
      updatedAt: Timestamp.now(),
    });
  },

  // Bulk update prices
  async bulkUpdatePrices(
    productIds: string[],
    priceChange: { type: 'percentage' | 'fixed'; value: number }
  ): Promise<void> {
    const batch = writeBatch(db);

    for (const productId of productIds) {
      const product = await this.getProduct(productId);
      if (!product) continue;

      let newPrice = product.price;
      if (priceChange.type === 'percentage') {
        newPrice = product.price * (1 + priceChange.value / 100);
      } else {
        newPrice = product.price + priceChange.value;
      }

      batch.update(doc(db, 'products', productId), {
        price: Math.round(newPrice * 100) / 100,
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
  },

  // Upload product image
  async uploadProductImage(productId: string, file: File): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `products/${productId}/${fileName}`);

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  // Delete product image
  async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  },

  // ============ CATEGORIES ============

  async getCategories(): Promise<ProductCategory[]> {
    const snapshot = await getDocs(
      query(collection(db, 'product_categories'), orderBy('sortOrder'))
    );
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductCategory[];
  },

  async createCategory(category: Omit<ProductCategory, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'product_categories'), category);
    return docRef.id;
  },

  async updateCategory(
    categoryId: string,
    updates: Partial<ProductCategory>
  ): Promise<void> {
    await updateDoc(doc(db, 'product_categories', categoryId), updates);
  },

  async deleteCategory(categoryId: string): Promise<void> {
    await deleteDoc(doc(db, 'product_categories', categoryId));
  },

  // ============ INVENTORY STATS ============

  async getInventoryStats(): Promise<InventoryStats> {
    const products = await this.getProducts();

    return {
      totalProducts: products.length,
      inStock: products.filter((p) => p.inStock).length,
      outOfStock: products.filter((p) => !p.inStock).length,
      lowStock: products.filter(
        (p) => p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK_THRESHOLD
      ).length,
      totalValue: products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0),
      byCategory: products.reduce(
        (acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },

  // Get products needing restock
  async getLowStockProducts(threshold: number = LOW_STOCK_THRESHOLD): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter((p) => p.stockQuantity <= threshold && p.stockQuantity > 0);
  },

  // Transform Firestore data to Product type
  transformProduct(id: string, data: DocumentData): Product {
    const stockQty = data.stockQuantity ?? data.stock ?? 0;
    return {
      id,
      name: data.name || '',
      description: data.description || '',
      category: data.category || '',
      brand: data.brand || '',
      price: data.price || 0,
      originalPrice: data.originalPrice,
      imageUrls: data.imageUrls || data.images || [],
      specifications: data.specifications || data.specs || {},
      compatibleWith: data.compatibleWith || data.compatibility || [],
      inStock: data.inStock !== undefined ? data.inStock : stockQty > 0,
      stockQuantity: stockQty,
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      createdAt: parseFirestoreDate(data.createdAt) || new Date(),
      updatedAt: parseFirestoreDate(data.updatedAt),
    };
  },
};
