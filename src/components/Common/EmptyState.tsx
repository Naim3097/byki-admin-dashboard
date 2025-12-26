// Empty State Component
import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  description?: string;
  image?: React.ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  description = 'No data available',
  image = Empty.PRESENTED_IMAGE_SIMPLE,
  buttonText,
  onButtonClick,
}) => {
  return (
    <Empty
      image={image}
      description={description}
      style={{ padding: 40 }}
    >
      {buttonText && onButtonClick && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onButtonClick}>
          {buttonText}
        </Button>
      )}
    </Empty>
  );
};
