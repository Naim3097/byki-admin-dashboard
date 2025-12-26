// Dashboard Page
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Space, List, Button } from 'antd';
import {
  ShoppingCartOutlined,
  CalendarOutlined,
  AlertOutlined,
  UserOutlined,
  DollarOutlined,
  WarningOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../../components/Charts/StatsCard';
import { RevenueChart } from '../../components/Charts/RevenueChart';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { analyticsService, DashboardStats } from '../../services/analytics.service';
import { ordersService } from '../../services/orders.service';
import { formatRM, formatRelativeTime } from '../../utils/formatters';
import { Order } from '../../types/order';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardStats, orders, revenue] = await Promise.all([
        analyticsService.getDashboardStats(),
        ordersService.getOrders({ limit: 5 }),
        analyticsService.getRevenueChartData(14),
      ]);

      setStats(dashboardStats);
      setRecentOrders(orders);
      setRevenueData(revenue);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Today's Orders"
            value={stats?.orders.total || 0}
            prefix={<ShoppingCartOutlined />}
            loading={loading}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Today's Revenue"
            value={stats?.orders.revenue || 0}
            prefix="RM"
            precision={2}
            loading={loading}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Today's Bookings"
            value={stats?.bookings.todayBookings || 0}
            prefix={<CalendarOutlined />}
            loading={loading}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Users"
            value={stats?.users.total || 0}
            prefix={<UserOutlined />}
            loading={loading}
          />
        </Col>
      </Row>

      {/* Alert Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {(stats?.emergencies.pending || 0) > 0 && (
          <Col span={24}>
            <Card
              style={{ background: '#fff2f0', borderColor: '#ffccc7' }}
              size="small"
            >
              <Space>
                <AlertOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                <Text strong style={{ color: '#cf1322' }}>
                  {stats?.emergencies.pending} Pending Emergency Request(s)
                </Text>
                <Button
                  type="primary"
                  danger
                  size="small"
                  onClick={() => navigate('/emergency')}
                >
                  View Now
                </Button>
              </Space>
            </Card>
          </Col>
        )}

        {(stats?.inventory.lowStock || 0) > 0 && (
          <Col xs={24} sm={12}>
            <Card style={{ background: '#fffbe6', borderColor: '#ffe58f' }} size="small">
              <Space>
                <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
                <Text strong style={{ color: '#d48806' }}>
                  {stats?.inventory.lowStock} Products Low on Stock
                </Text>
                <Button size="small" onClick={() => navigate('/catalog/products')}>
                  Manage
                </Button>
              </Space>
            </Card>
          </Col>
        )}

        {(stats?.support.open || 0) > 0 && (
          <Col xs={24} sm={12}>
            <Card style={{ background: '#e6f7ff', borderColor: '#91d5ff' }} size="small">
              <Space>
                <DollarOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                <Text strong style={{ color: '#096dd9' }}>
                  {stats?.support.open} Open Support Tickets
                </Text>
                <Button size="small" onClick={() => navigate('/support')}>
                  View
                </Button>
              </Space>
            </Card>
          </Col>
        )}
      </Row>

      {/* Charts and Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <RevenueChart data={revenueData} loading={loading} />
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Recent Orders"
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/orders')}
                icon={<ArrowRightOutlined />}
              >
                View All
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={recentOrders}
              renderItem={(order) => (
                <List.Item
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>#{order.orderNumber}</Text>
                        <StatusBadge status={order.status} type="order" />
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>{formatRM(order.total)}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatRelativeTime(order.createdAt)}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
