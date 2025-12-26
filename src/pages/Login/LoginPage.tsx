// Login Page
import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, error, clearError } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    clearError();

    try {
      await signIn(values.email, values.password);
      message.success('Welcome to BYKI Admin Dashboard!');
      navigate('/');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            BYKI Admin
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        {error && (
          <div
            style={{
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: 6,
              padding: '8px 12px',
              marginBottom: 24,
              color: '#cf1322',
            }}
          >
            {error}
          </div>
        )}

        <Form
          name="login"
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Admin access only. Contact support if you need access.
          </Text>
        </div>
      </Card>
    </div>
  );
};
