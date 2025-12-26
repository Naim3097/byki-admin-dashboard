// User Avatar Component
import React from 'react';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getInitials } from '../../utils/helpers';

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  size?: 'small' | 'default' | 'large' | number;
  showTooltip?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  imageUrl,
  size = 'default',
  showTooltip = false,
}) => {
  const avatar = imageUrl ? (
    <Avatar src={imageUrl} size={size} />
  ) : name ? (
    <Avatar
      size={size}
      style={{ backgroundColor: '#1890ff' }}
    >
      {getInitials(name)}
    </Avatar>
  ) : (
    <Avatar size={size} icon={<UserOutlined />} />
  );

  if (showTooltip && name) {
    return <Tooltip title={name}>{avatar}</Tooltip>;
  }

  return avatar;
};
