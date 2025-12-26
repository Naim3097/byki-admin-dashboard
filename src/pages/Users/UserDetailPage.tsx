// User Detail Page
import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Tabs,
  Table,
  Tag,
  message,
  Select,
  Row,
  Col,
  Statistic,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { UserAvatar } from '../../components/Common/UserAvatar';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { usersService } from '../../services/users.service';
import { ordersService } from '../../services/orders.service';
import { bookingsService } from '../../services/bookings.service';
import { User, Vehicle, LoyaltyAccount } from '../../types/user';
import { Order } from '../../types/order';
import { Booking } from '../../types/booking';
import { formatDateTime, formatRM } from '../../utils/formatters';
import { USER_ROLES, LOYALTY_TIERS } from '../../config/constants';

const { Title, Text } = Typography;

export const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [userData, vehiclesData, loyaltyData, ordersData, bookingsData] = await Promise.all([
        usersService.getUser(userId),
        usersService.getUserVehicles(userId),
        usersService.getLoyaltyAccount(userId),
        ordersService.getOrders({ userId }),
        bookingsService.getBookings({ userId }),
      ]);

      setUser(userData);
      setVehicles(vehiclesData);
      setLoyalty(loyaltyData);
      setOrders(ordersData);
      setBookings(bookingsData);
    } catch (error) {
      message.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (role: string) => {
    if (!userId) return;

    try {
      await usersService.updateUser(userId, { role: role as User['role'] });
      message.success('User role updated');
      loadUserData();
    } catch (error) {
      message.error('Failed to update role');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Title level={4}>User not found</Title>
        <Button onClick={() => navigate('/users')}>Back to Users</Button>
      </div>
    );
  }

  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      render: (num: string, record: Order) => (
        <Button type="link" onClick={() => navigate(`/orders/${record.id}`)}>
          #{num}
        </Button>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      render: (total: number) => formatRM(total),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => <StatusBadge status={status} type="order" />,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (date: Date) => formatDateTime(date),
    },
  ];

  const vehicleColumns = [
    {
      title: 'Vehicle',
      render: (_: unknown, record: Vehicle) => `${record.brand} ${record.model} (${record.year})`,
    },
    {
      title: 'License Plate',
      dataIndex: 'licensePlate',
    },
    {
      title: 'Primary',
      dataIndex: 'isPrimary',
      render: (isPrimary: boolean) => isPrimary ? <Tag color="blue">Primary</Tag> : null,
    },
  ];

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          User Profile
        </Title>
      </Space>

      <Row gutter={24}>
        <Col xs={24} lg={8}>
          {/* User Info Card */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <UserAvatar
                name={user.name}
                imageUrl={user.profileImageUrl}
                size={80}
              />
              <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {user.name}
              </Title>
              <StatusBadge status={user.role} type="role" />
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{user.phone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Joined">{formatDateTime(user.createdAt)}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Text strong>Change Role:</Text>
              <Select
                value={user.role}
                style={{ width: '100%', marginTop: 8 }}
                onChange={handleRoleChange}
              >
                {Object.entries(USER_ROLES).map(([key, value]) => (
                  <Select.Option key={key} value={key}>
                    {value.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Loyalty Card */}
          {loyalty && (
            <Card title="Loyalty Status" style={{ marginBottom: 24 }}>
              <Statistic
                title="Points Balance"
                value={loyalty.totalPoints}
                suffix="pts"
              />
              <Tag
                color={LOYALTY_TIERS[loyalty.tier]?.color}
                style={{ marginTop: 8 }}
              >
                {LOYALTY_TIERS[loyalty.tier]?.label || loyalty.tier} Tier
              </Tag>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Lifetime Points: {loyalty.lifetimePoints}
              </Text>
            </Card>
          )}

          {/* Stats Card */}
          <Card title="Activity Summary">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Orders" value={orders.length} />
              </Col>
              <Col span={12}>
                <Statistic title="Total Spent" value={totalSpent} prefix="RM" precision={2} />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic title="Bookings" value={bookings.length} />
              </Col>
              <Col span={12}>
                <Statistic title="Vehicles" value={vehicles.length} />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card>
            <Tabs
              items={[
                {
                  key: 'orders',
                  label: `Orders (${orders.length})`,
                  children: (
                    <Table
                      columns={orderColumns}
                      dataSource={orders}
                      rowKey="id"
                      pagination={{ pageSize: 5 }}
                      size="small"
                    />
                  ),
                },
                {
                  key: 'bookings',
                  label: `Bookings (${bookings.length})`,
                  children: (
                    <Table
                      columns={[
                        { title: 'Workshop', dataIndex: 'workshopName' },
                        { title: 'Date', dataIndex: 'appointmentDate', render: (d: Date) => formatDateTime(d) },
                        { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} type="booking" /> },
                      ]}
                      dataSource={bookings}
                      rowKey="id"
                      pagination={{ pageSize: 5 }}
                      size="small"
                    />
                  ),
                },
                {
                  key: 'vehicles',
                  label: `Vehicles (${vehicles.length})`,
                  children: (
                    <Table
                      columns={vehicleColumns}
                      dataSource={vehicles}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
