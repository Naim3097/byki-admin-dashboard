// Emergency Monitor Page
import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  // Select,
  Input,
  Row,
  Col,
  Statistic,
  message,
  Alert,
} from 'antd';
import {
  AlertOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { emergencyService } from '../../services/emergency.service';
import { EmergencyRequest, EmergencyStatus, EmergencyStats } from '../../types/emergency';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
// import { EMERGENCY_STATUSES } from '../../config/constants';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export const EmergencyMonitorPage: React.FC = () => {
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchModal, setDispatchModal] = useState<{
    open: boolean;
    emergency: EmergencyRequest | null;
  }>({ open: false, emergency: null });
  const [mechanicName, setMechanicName] = useState('');

  useEffect(() => {
    loadEmergencies();
    // Set up real-time listener
    const unsubscribe = emergencyService.subscribeToActiveEmergencies((data) => {
      setEmergencies(data);
    });

    return () => unsubscribe();
  }, []);

  const loadEmergencies = async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        emergencyService.getActiveEmergencies(),
        emergencyService.getEmergencyStats(),
      ]);
      setEmergencies(data);
      setStats(statsData);
    } catch (error) {
      message.error('Failed to load emergency requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, status: EmergencyStatus) => {
    try {
      await emergencyService.updateEmergencyStatus(requestId, status);
      message.success('Status updated');
      loadEmergencies();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleDispatch = async () => {
    if (!dispatchModal.emergency || !mechanicName.trim()) {
      message.error('Please enter mechanic name');
      return;
    }

    try {
      await emergencyService.assignMechanic(
        dispatchModal.emergency.id,
        `mechanic_${Date.now()}`,
        mechanicName
      );
      message.success('Mechanic dispatched');
      setDispatchModal({ open: false, emergency: null });
      setMechanicName('');
      loadEmergencies();
    } catch (error) {
      message.error('Failed to dispatch mechanic');
    }
  };

  const getEmergencyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakdown: '🚗 Breakdown',
      accident: '💥 Accident',
      flatTire: '🔧 Flat Tire',
      flat_tire: '🔧 Flat Tire', // Legacy support
      battery: '🔋 Battery',
      fuel: '⛽ Out of Fuel',
      lockout: '🔐 Lockout',
      tow: '🚛 Tow',
      other: '❓ Other',
    };
    return labels[type] || `❓ ${type}`;
  };

  const pendingCount = emergencies.filter((e) => e.status === 'pending').length;

  const columns: ColumnsType<EmergencyRequest> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'accident' ? 'red' : 'orange'}>{getEmergencyTypeLabel(type)}</Tag>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.userName || 'Unknown'}</Text>
          {record.userPhone && (
            <Text type="secondary">
              <PhoneOutlined /> {record.userPhone}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.address || 'Address not available'}</Text>
          <Button
            type="link"
            size="small"
            icon={<EnvironmentOutlined />}
            onClick={() =>
              window.open(
                `https://www.google.com/maps?q=${record.latitude},${record.longitude}`,
                '_blank'
              )
            }
          >
            View on Map
          </Button>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: EmergencyStatus) => <StatusBadge status={status} type="emergency" />,
    },
    {
      title: 'Mechanic',
      dataIndex: 'mechanicName',
      key: 'mechanicName',
      render: (name: string) => name || '-',
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{formatRelativeTime(record.createdAt)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDateTime(record.createdAt)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space wrap>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              onClick={() => setDispatchModal({ open: true, emergency: record })}
            >
              Dispatch
            </Button>
          )}
          {record.status === 'dispatched' && (
            <Button
              size="small"
              onClick={() => handleStatusChange(record.id, 'enRoute')}
            >
              En Route
            </Button>
          )}
          {record.status === 'enRoute' && (
            <Button
              size="small"
              onClick={() => handleStatusChange(record.id, 'arrived')}
            >
              Arrived
            </Button>
          )}
          {record.status === 'arrived' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(record.id, 'completed')}
            >
              Complete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <AlertOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
          <Title level={4} style={{ margin: 0 }}>
            Emergency Monitor
          </Title>
          {pendingCount > 0 && (
            <Tag color="error" className="emergency-pulse">
              {pendingCount} PENDING
            </Tag>
          )}
        </Space>
        <Button icon={<ReloadOutlined />} onClick={loadEmergencies}>
          Refresh
        </Button>
      </div>

      {pendingCount > 0 && (
        <Alert
          message={`${pendingCount} emergency request(s) awaiting response!`}
          type="error"
          showIcon
          icon={<AlertOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={stats?.pending || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Active"
              value={stats?.active || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Completed Today"
              value={stats?.completedToday || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Avg Response (min)"
              value={stats?.averageResponseTime || 0}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={emergencies}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowClassName={(record) => (record.status === 'pending' ? 'emergency-pulse' : '')}
      />

      {/* Dispatch Modal */}
      <Modal
        title="Dispatch Mechanic"
        open={dispatchModal.open}
        onCancel={() => {
          setDispatchModal({ open: false, emergency: null });
          setMechanicName('');
        }}
        onOk={handleDispatch}
        okText="Dispatch"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Emergency Details:</Text>
          <br />
          <Text>Type: {getEmergencyTypeLabel(dispatchModal.emergency?.type || '')}</Text>
          <br />
          <Text>Location: {dispatchModal.emergency?.address || 'N/A'}</Text>
        </div>
        <Input
          placeholder="Enter mechanic name"
          value={mechanicName}
          onChange={(e) => setMechanicName(e.target.value)}
        />
      </Modal>
    </div>
  );
};
