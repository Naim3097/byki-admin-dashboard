// Products List Page
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Image,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Form,
  InputNumber,
  Switch,
  Upload,
  Typography,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  WarningOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { productsService } from '../../services/products.service';
import { Product, InventoryStats } from '../../types/product';
import { formatRM } from '../../utils/formatters';
import { PRODUCT_CATEGORIES, LOW_STOCK_THRESHOLD } from '../../config/constants';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState({ category: '', brand: '', search: '' });
  const [form] = Form.useForm();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Handle image upload to Firebase Storage
  const handleImageUpload = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `products/${fileName}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const uploadProps: UploadProps = {
    beforeUpload: async (file) => {
      setUploading(true);
      try {
        const url = await handleImageUpload(file);
        setImageUrls(prev => [...prev, url]);
        setFileList(prev => [...prev, {
          uid: url,
          name: file.name,
          status: 'done',
          url: url,
        }]);
        message.success(`${file.name} uploaded successfully`);
      } catch (error) {
        message.error(`${file.name} upload failed`);
      } finally {
        setUploading(false);
      }
      return false; // Prevent default upload
    },
    onRemove: (file) => {
      setImageUrls(prev => prev.filter(url => url !== file.url));
      setFileList(prev => prev.filter(f => f.uid !== file.uid));
    },
    fileList,
    listType: 'picture-card',
    accept: 'image/*',
  };

  useEffect(() => {
    loadData();
  }, [filters.category, filters.brand]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('[ProductsPage] Loading data...');
      const [prods, inventoryStats] = await Promise.all([
        productsService.getProducts({
          category: filters.category || undefined,
          brand: filters.brand || undefined,
        }),
        productsService.getInventoryStats(),
      ]);
      console.log('[ProductsPage] Loaded', prods.length, 'products');
      setProducts(prods);
      setStats(inventoryStats);
    } catch (error) {
      console.error('[ProductsPage] Error loading products:', error);
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await productsService.deleteProduct(productId);
      message.success('Product deleted');
      loadData();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleSave = async (values: Partial<Product>) => {
    try {
      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, {
          ...values,
          imageUrls: imageUrls.length > 0 ? imageUrls : editingProduct.imageUrls,
        });
        message.success('Product updated');
      } else {
        await productsService.createProduct({
          ...values,
          imageUrls: imageUrls,
          specifications: {},
          compatibleWith: [],
          rating: 0,
          reviewCount: 0,
        } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        message.success('Product created');
      }
      setEditorOpen(false);
      setEditingProduct(null);
      setImageUrls([]);
      setFileList([]);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('Failed to save product');
    }
  };

  const openEditor = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue(product);
      // Load existing images
      const existingUrls = product.imageUrls || [];
      setImageUrls(existingUrls);
      setFileList(existingUrls.map((url, idx) => ({
        uid: url,
        name: `Image ${idx + 1}`,
        status: 'done' as const,
        url: url,
      })));
    } else {
      setEditingProduct(null);
      form.resetFields();
      setImageUrls([]);
      setFileList([]);
    }
    setEditorOpen(true);
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrls',
      width: 80,
      render: (urls: string[]) => (
        <Image
          src={urls?.[0] || '/placeholder.png'}
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgesLANzgP3z5IQtRAAAAUGVYSWZNTQAqAAAACAACARIAAwAAAAEAAQAA h7o0ABJREFUeAHt3Qd4FNXaBvA3vYcEQgklhBJ67733IqKgYgG7YsNesVz1WrD33ivYQUVAQAGkg0jvvYSaThKSkL7/nnPu7J3Z3ewmILm5/odn2J2dOXPmzJx/vpmZ3QAAAAAAAAD+XxSw6j4AgP8FTIEDAEFACgAEgSAAsRUQ"
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      width: 100,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      width: 100,
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      width: 120,
      render: (price: number, record: Product) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatRM(price)}</Text>
          {record.originalPrice && (
            <Text delete type="secondary" style={{ fontSize: 12 }}>
              {formatRM(record.originalPrice)}
            </Text>
          )}
        </Space>
      ),
      sorter: (a: Product, b: Product) => a.price - b.price,
    },
    {
      title: 'Stock',
      dataIndex: 'stockQuantity',
      width: 100,
      render: (qty: number) => (
        <span
          style={{
            color:
              qty <= 0
                ? '#ff4d4f'
                : qty <= LOW_STOCK_THRESHOLD
                  ? '#faad14'
                  : '#52c41a',
          }}
        >
          {qty <= LOW_STOCK_THRESHOLD && qty > 0 && <WarningOutlined />} {qty}
        </span>
      ),
      sorter: (a: Product, b: Product) => a.stockQuantity - b.stockQuantity,
    },
    {
      title: 'Status',
      dataIndex: 'inStock',
      width: 100,
      render: (inStock: boolean) => (
        <Tag color={inStock ? 'green' : 'red'}>{inStock ? 'In Stock' : 'Out of Stock'}</Tag>
      ),
    },
    {
      title: 'Actions',
      width: 120,
      render: (_: unknown, record: Product) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEditor(record)} />
          <Popconfirm title="Delete this product?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Filter products by search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.brand.toLowerCase().includes(filters.search.toLowerCase())
  );

  // Get unique brands
  const brands = [...new Set(products.map((p) => p.brand))];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Products
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Total Products" value={stats.totalProducts} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="In Stock" value={stats.inStock} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Low Stock"
                value={stats.lowStock}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Inventory Value"
                value={stats.totalValue}
                prefix="RM"
                precision={2}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Category"
            allowClear
            style={{ width: 150 }}
            value={filters.category || undefined}
            onChange={(v) => setFilters({ ...filters, category: v || '' })}
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <Select.Option key={cat} value={cat}>
                {cat}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Brand"
            allowClear
            showSearch
            style={{ width: 150 }}
            value={filters.brand || undefined}
            onChange={(v) => setFilters({ ...filters, brand: v || '' })}
          >
            {brands.map((b) => (
              <Select.Option key={b} value={b}>
                {b}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Products Table */}
      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      {/* Product Editor Modal */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        open={editorOpen}
        onCancel={() => {
          setEditorOpen(false);
          setEditingProduct(null);
          setImageUrls([]);
          setFileList([]);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="e.g., Honda Genuine 0W-20 Full Synthetic" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="brand"
                label="Brand"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="e.g., Honda, Castrol" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Product description..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select placeholder="Select category">
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price (RM)"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="originalPrice" label="Original Price (RM)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stockQuantity" label="Stock Quantity" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inStock"
                label="In Stock"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          {/* Image Upload Section */}
          <Form.Item label="Product Images">
            <Upload {...uploadProps}>
              {fileList.length < 5 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>{uploading ? 'Uploading...' : 'Upload'}</div>
                </div>
              )}
            </Upload>
            {imageUrls.length === 0 && !uploading && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Click to upload product images (max 5)
              </Text>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
