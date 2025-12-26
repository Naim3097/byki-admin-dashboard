// Users List Page
import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  Space,
  Button,
  Typography,
  // Tag,
  message,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { UserAvatar } from '../../components/Common/UserAvatar';
import { usersService } from '../../services/users.service';
import { User } from '../../types/user';
import { formatDateTime } from '../../utils/formatters';
import { USER_ROLES } from '../../config/constants';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export const UsersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
  });

  useEffect(() => {
    loadUsers();
  }, [filters.role]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { users: data } = await usersService.getUsers({
        role: filters.role || undefined,
      });
      console.log('Loaded users:', data.length, data);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <UserAvatar name={record.name} imageUrl={record.profileImageUrl} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <StatusBadge status={role} type="role" />,
      filters: Object.entries(USER_ROLES).map(([key, value]) => ({
        text: value.label,
        value: key,
      })),
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => navigate(`/users/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  // Filter users
  let filteredUsers = users;
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.phone?.includes(search)
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Users
        </Title>
        <Button icon={<ReloadOutlined />} onClick={loadUsers}>
          Refresh
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Role"
            allowClear
            style={{ width: 150 }}
            value={filters.role || undefined}
            onChange={(v) => setFilters({ ...filters, role: v || '' })}
          >
            {Object.entries(USER_ROLES).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value.label}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </div>
  );
};
