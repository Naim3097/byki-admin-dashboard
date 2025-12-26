// Admin Layout Component
import React from 'react';
import { Layout, Badge, Avatar, Dropdown, Space, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useEmergencyAlerts } from '../../hooks/useEmergencyAlerts';
import { useActiveEmergencies } from '../../hooks/useRealtime';

const { Header, Content } = Layout;

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, signOut } = useAuthStore();
  const { data: emergencies } = useActiveEmergencies();

  // Enable emergency alerts
  useEmergencyAlerts();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleSignOut,
    },
  ];

  const pendingEmergencies = (emergencies as Array<{ status: string }> | undefined)?.filter((e) => e.status === 'pending').length || 0;

  const sidebarWidth = sidebarCollapsed ? 80 : 240;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <Layout style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div
            onClick={toggleSidebar}
            style={{ cursor: 'pointer', fontSize: 18 }}
          >
            {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Space size={24}>
            {/* Emergency Alert Bell */}
            <Badge count={pendingEmergencies} overflowCount={9}>
              <BellOutlined
                style={{
                  fontSize: 20,
                  cursor: 'pointer',
                  color: pendingEmergencies > 0 ? '#ff4d4f' : undefined,
                }}
                onClick={() => navigate('/emergency')}
                className={pendingEmergencies > 0 ? 'emergency-pulse' : ''}
              />
            </Badge>

            {/* User Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  style={{ backgroundColor: token.colorPrimary }}
                  icon={<UserOutlined />}
                />
                <span>{user?.name || 'Admin'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
