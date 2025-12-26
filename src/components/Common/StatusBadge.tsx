// Status Badge Component
import React from 'react';
import { Tag } from 'antd';
import {
  ORDER_STATUSES,
  BOOKING_STATUSES,
  EMERGENCY_STATUSES,
  TICKET_STATUSES,
  USER_ROLES,
} from '../../config/constants';

type StatusType = 'order' | 'booking' | 'emergency' | 'ticket' | 'role';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
}

const statusMaps: Record<StatusType, Record<string, { label: string; color: string }>> = {
  order: ORDER_STATUSES,
  booking: BOOKING_STATUSES,
  emergency: EMERGENCY_STATUSES,
  ticket: TICKET_STATUSES,
  role: USER_ROLES,
};

// Combined status config for auto-detection
const allStatuses: Record<string, { label: string; color: string }> = {
  ...ORDER_STATUSES,
  ...BOOKING_STATUSES,
  ...EMERGENCY_STATUSES,
  ...TICKET_STATUSES,
  ...USER_ROLES,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  let config: { label: string; color: string } | undefined;

  if (type) {
    config = statusMaps[type][status];
  } else {
    config = allStatuses[status];
  }

  if (!config) {
    config = { label: status, color: 'default' };
  }

  return <Tag color={config.color}>{config.label}</Tag>;
};
