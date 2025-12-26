// Revenue Chart Component
import React from 'react';
import { Card } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RevenueChartProps {
  data: { date: string; revenue: number; orders: number }[];
  loading?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  return (
    <Card title="Revenue Overview" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'revenue') {
                return [`RM ${value.toFixed(2)}`, 'Revenue'];
              }
              return [value, 'Orders'];
            }}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-MY');
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#1890ff"
            strokeWidth={2}
            dot={false}
            name="Revenue (RM)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            stroke="#52c41a"
            strokeWidth={2}
            dot={false}
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
