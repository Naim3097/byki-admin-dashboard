// Loading Spinner Component
import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  tip = 'Loading...',
  fullScreen = false,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 40 : size === 'small' ? 20 : 30 }} spin />;

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
        }}
      >
        <Spin indicator={antIcon} tip={tip} size={size} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <Spin indicator={antIcon} tip={tip} size={size} />
    </div>
  );
};
