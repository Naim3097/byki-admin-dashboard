// Stats Card Component
import React from 'react';
import { Card, Statistic, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatsCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  precision?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  valueStyle?: React.CSSProperties;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  precision = 0,
  trend,
  loading = false,
  valueStyle,
}) => {
  return (
    <Card size="small" className="stats-card" loading={loading}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        precision={precision}
        valueStyle={valueStyle}
      />
      {trend && (
        <Space style={{ marginTop: 8 }}>
          {trend.isPositive ? (
            <ArrowUpOutlined style={{ color: '#3f8600' }} />
          ) : (
            <ArrowDownOutlined style={{ color: '#cf1322' }} />
          )}
          <span
            style={{
              color: trend.isPositive ? '#3f8600' : '#cf1322',
              fontSize: 12,
            }}
          >
            {Math.abs(trend.value).toFixed(1)}%
          </span>
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>vs last period</span>
        </Space>
      )}
    </Card>
  );
};
