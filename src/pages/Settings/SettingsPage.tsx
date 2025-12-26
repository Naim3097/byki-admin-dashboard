// Settings Page
import React from 'react';
import { Card, Typography, Descriptions, Divider, Button, Space, Tag } from 'antd';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { UserAvatar } from '../../components/Common/UserAvatar';

const { Title, Text, Paragraph } = Typography;

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div>
      <Title level={4}>Settings</Title>

      {/* Profile Section */}
      <Card title="Admin Profile" style={{ marginBottom: 24 }}>
        <Space align="start" size={24}>
          <UserAvatar name={user?.name} size={80} />
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {user?.name}
            </Title>
            <Text type="secondary">{user?.email}</Text>
            <br />
            <StatusBadge status={user?.role || 'admin'} type="role" />
          </div>
        </Space>
      </Card>

      {/* Firebase Configuration */}
      <Card title="Firebase Configuration" style={{ marginBottom: 24 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Project ID">
            <Tag>oxhub-42c99</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Auth Domain">
            oxhub-42c99.firebaseapp.com
          </Descriptions.Item>
          <Descriptions.Item label="Storage Bucket">
            oxhub-42c99.firebasestorage.app
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Paragraph type="secondary">
          This admin dashboard is connected to the same Firebase project as your BYKI mobile app.
          All data changes here will be reflected in the mobile app in real-time.
        </Paragraph>
      </Card>

      {/* Quick Links */}
      <Card title="Quick Links">
        <Space direction="vertical">
          <Button
            type="link"
            onClick={() => window.open('https://console.firebase.google.com/project/oxhub-42c99', '_blank')}
          >
            Open Firebase Console
          </Button>
          <Button
            type="link"
            onClick={() => window.open('https://console.firebase.google.com/project/oxhub-42c99/firestore', '_blank')}
          >
            View Firestore Database
          </Button>
          <Button
            type="link"
            onClick={() => window.open('https://console.firebase.google.com/project/oxhub-42c99/storage', '_blank')}
          >
            View Storage
          </Button>
          <Button
            type="link"
            onClick={() => window.open('https://console.firebase.google.com/project/oxhub-42c99/authentication/users', '_blank')}
          >
            View Users Authentication
          </Button>
        </Space>
      </Card>
    </div>
  );
};
