// Orders List Page
import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  Space,
  Button,
  DatePicker,
  Typography,
  message,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { ordersService } from '../../services/orders.service';
import { Order, OrderStatus } from '../../types/order';
import { formatDateTime, formatRM } from '../../utils/formatters';
import { ORDER_STATUSES } from '../../config/constants';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export const OrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '' as OrderStatus | '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  useEffect(() => {
    loadOrders();
  }, [filters.status]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersService.getOrders({
        status: filters.status || undefined,
      });
      setOrders(data);
    } catch (error) {
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, status);
      message.success('Order status updated');
      loadOrders();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: Order) => (
        <Button type="link" onClick={() => navigate(`/orders/${record.id}`)}>
          #{text}
        </Button>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: Order['items']) => (
        <span>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => <strong>{formatRM(total)}</strong>,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => <StatusBadge status={status} type="order" />,
      filters: Object.entries(ORDER_STATUSES).map(([key, value]) => ({
        text: value.label,
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record: Order) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            View
          </Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 130 }}
            onChange={(status) => handleStatusChange(record.id, status)}
          >
            {Object.entries(ORDER_STATUSES).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value.label}
              </Select.Option>
            ))}
          </Select>
        </Space>
      ),
    },
  ];

  // Filter orders
  let filteredOrders = orders;
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredOrders = filteredOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(search) ||
        o.id.toLowerCase().includes(search)
    );
  }
  if (filters.dateRange) {
    filteredOrders = filteredOrders.filter((o) => {
      const date = dayjs(o.createdAt);
      return date.isAfter(filters.dateRange![0]) && date.isBefore(filters.dateRange![1]);
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Orders
        </Title>
        <Button icon={<ReloadOutlined />} onClick={loadOrders}>
          Refresh
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search orders..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            value={filters.status || undefined}
            onChange={(v) => setFilters({ ...filters, status: v || '' })}
          >
            {Object.entries(ORDER_STATUSES).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value.label}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) =>
              setFilters({
                ...filters,
                dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null,
              })
            }
          />
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </div>
  );
};
