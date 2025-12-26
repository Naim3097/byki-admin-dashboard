// Orders Chart Component
import React from 'react';
import { Card } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface OrdersChartProps {
  data: { status: string; count: number; color: string }[];
  loading?: boolean;
}

export const OrdersChart: React.FC<OrdersChartProps> = ({ data, loading }) => {
  return (
    <Card title="Orders by Status" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="status" width={120} />
          <Tooltip />
          <Bar dataKey="count" name="Orders">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
