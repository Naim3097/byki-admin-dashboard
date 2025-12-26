// Order Detail Page
import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Table,
  // Tag,
  Button,
  Space,
  Select,
  Typography,
  message,
  Divider,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ordersService } from '../../services/orders.service';
import { usersService } from '../../services/users.service';
import { Order, OrderStatus } from '../../types/order';
import { User } from '../../types/user';
import { formatDateTime, formatRM } from '../../utils/formatters';
import { ORDER_STATUSES } from '../../config/constants';

const { Title, Text } = Typography;

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const orderData = await ordersService.getOrder(orderId);
      if (orderData) {
        setOrder(orderData);
        // Load customer data
        const userData = await usersService.getUser(orderData.userId);
        setCustomer(userData);
      }
    } catch (error) {
      message.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: OrderStatus) => {
    if (!orderId) return;

    try {
      await ordersService.updateOrderStatus(orderId, status);
      message.success('Order status updated');
      loadOrderData();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Title level={4}>Order not found</Title>
        <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => formatRM(price),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (total: number) => <strong>{formatRM(total)}</strong>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Order #{order.orderNumber}
        </Title>
        <StatusBadge status={order.status} type="order" />
      </Space>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {/* Order Items */}
          <Card title="Order Items" style={{ marginBottom: 24 }}>
            <Table
              columns={itemColumns}
              dataSource={order.items}
              rowKey="productId"
              pagination={false}
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>Subtotal</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      {formatRM(order.subtotal)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {order.discount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text type="success">Discount</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text type="success">-{formatRM(order.discount)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {order.tax > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        Tax
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        {formatRM(order.tax)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong style={{ fontSize: 16 }}>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ fontSize: 16 }}>{formatRM(order.total)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card title="Order Notes" style={{ marginBottom: 24 }}>
              <Text>{order.notes}</Text>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          {/* Order Details */}
          <Card title="Order Details" style={{ marginBottom: 24 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Order ID">{order.id}</Descriptions.Item>
              <Descriptions.Item label="Order Number">#{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDateTime(order.createdAt)}</Descriptions.Item>
              {order.updatedAt && (
                <Descriptions.Item label="Updated">{formatDateTime(order.updatedAt)}</Descriptions.Item>
              )}
              <Descriptions.Item label="Payment Method">
                {order.paymentMethod || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Update Status</Text>
            </div>
            <Select
              value={order.status}
              style={{ width: '100%' }}
              onChange={handleStatusChange}
            >
              {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                <Select.Option key={key} value={key}>
                  {value.label}
                </Select.Option>
              ))}
            </Select>
          </Card>

          {/* Customer Info */}
          <Card title="Customer Information">
            {customer ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">{customer.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{customer.phone || 'N/A'}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">Customer information not available</Text>
            )}
            {customer && (
              <Button
                type="link"
                style={{ padding: 0, marginTop: 8 }}
                onClick={() => navigate(`/users/${customer.id}`)}
              >
                View Customer Profile
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
