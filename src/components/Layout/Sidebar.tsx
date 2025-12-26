// Sidebar Component
import React from 'react';
import { Layout, Menu, Badge, theme } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  AlertOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  ShopOutlined,
  AppstoreOutlined,
  TagOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActiveEmergencies } from '../../hooks/useRealtime';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { data: emergencies } = useActiveEmergencies();

  const pendingEmergencies = (emergencies as Array<{ status: string }> | undefined)?.filter((e) => e.status === 'pending').length || 0;

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/emergency',
      icon: (
        <Badge count={pendingEmergencies} size="small" offset={[5, 0]}>
          <AlertOutlined
            style={{ color: pendingEmergencies > 0 ? '#ff4d4f' : undefined }}
          />
        </Badge>
      ),
      label: 'Emergency',
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
    },
    {
      key: '/bookings',
      icon: <CalendarOutlined />,
      label: 'Bookings',
    },
    {
      key: '/support',
      icon: <CustomerServiceOutlined />,
      label: 'Support',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: 'catalog',
      icon: <ShopOutlined />,
      label: 'Catalog',
      children: [
        {
          key: '/catalog/products',
          icon: <AppstoreOutlined />,
          label: 'Products',
        },
        {
          key: '/catalog/workshops',
          icon: <ShopOutlined />,
          label: 'Workshops',
        },
        {
          key: '/catalog/vouchers',
          icon: <TagOutlined />,
          label: 'Vouchers',
        },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/catalog')) {
      return path;
    }
    if (path.startsWith('/orders')) return '/orders';
    if (path.startsWith('/bookings')) return '/bookings';
    if (path.startsWith('/users')) return '/users';
    return path;
  };

  const getOpenKeys = () => {
    if (location.pathname.startsWith('/catalog')) {
      return ['catalog'];
    }
    return [];
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      collapsedWidth={80}
      theme="dark"
      width={240}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2
          style={{
            color: token.colorPrimary,
            margin: 0,
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'BA' : 'BYKI Admin'}
        </h2>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={({ key }) => {
          if (!key.startsWith('catalog') || key.includes('/')) {
            navigate(key);
          }
        }}
        style={{ marginTop: 8 }}
      />
    </Sider>
  );
};
