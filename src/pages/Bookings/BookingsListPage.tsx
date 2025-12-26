// Bookings List Page
import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  Space,
  Button,
  DatePicker,
  Typography,
  message,
  Tag,
  Modal,
  Form,
  TimePicker,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { bookingsService } from '../../services/bookings.service';
import { Booking, BookingStatus } from '../../types/booking';
import { formatDateTime, formatDate } from '../../utils/formatters';
import { BOOKING_STATUSES } from '../../config/constants';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;

export const BookingsListPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; booking: Booking | null }>({
    open: false,
    booking: null,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '' as BookingStatus | '',
    date: null as dayjs.Dayjs | null,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadBookings();
  }, [filters.status]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingsService.getBookings({
        status: filters.status || undefined,
      });
      setBookings(data);
    } catch (error) {
      message.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await bookingsService.updateBookingStatus(bookingId, status);
      message.success('Booking status updated');
      loadBookings();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleReschedule = async (values: { date: dayjs.Dayjs; time: dayjs.Dayjs }) => {
    if (!rescheduleModal.booking) return;

    try {
      await bookingsService.rescheduleBooking(
        rescheduleModal.booking.id,
        values.date.toDate(),
        values.time.format('HH:mm')
      );
      message.success('Booking rescheduled');
      setRescheduleModal({ open: false, booking: null });
      form.resetFields();
      loadBookings();
    } catch (error) {
      message.error('Failed to reschedule booking');
    }
  };

  const columns: ColumnsType<Booking> = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Tag>{id.slice(0, 8).toUpperCase()}</Tag>,
    },
    {
      title: 'Workshop',
      dataIndex: 'workshopName',
      key: 'workshopName',
      render: (name: string) => name || 'N/A',
    },
    {
      title: 'Appointment',
      key: 'appointment',
      render: (_, record: Booking) => (
        <Space direction="vertical" size={0}>
          <span>{formatDate(record.appointmentDate)}</span>
          <Tag color="blue">{record.timeSlot}</Tag>
        </Space>
      ),
      sorter: (a, b) =>
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    },
    {
      title: 'Services',
      dataIndex: 'services',
      key: 'services',
      render: (services: string[]) => (
        <Space wrap>
          {services.slice(0, 2).map((service, idx) => (
            <Tag key={idx}>{service}</Tag>
          ))}
          {services.length > 2 && <Tag>+{services.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: BookingStatus) => <StatusBadge status={status} type="booking" />,
      filters: Object.entries(BOOKING_STATUSES).map(([key, value]) => ({
        text: value.label,
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => formatDateTime(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_, record: Booking) => (
        <Space wrap>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(record.id, 'confirmed')}
              >
                Confirm
              </Button>
              <Button
                size="small"
                icon={<CalendarOutlined />}
                onClick={() => setRescheduleModal({ open: true, booking: record })}
              >
                Reschedule
              </Button>
            </>
          )}
          {record.status === 'confirmed' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleStatusChange(record.id, 'inProgress')}
            >
              Start Service
            </Button>
          )}
          {record.status === 'inProgress' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleStatusChange(record.id, 'completed')}
            >
              Complete
            </Button>
          )}
          {['pending', 'confirmed'].includes(record.status) && (
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleStatusChange(record.id, 'cancelled')}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Filter bookings
  let filteredBookings = bookings;
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredBookings = filteredBookings.filter(
      (b) =>
        b.id.toLowerCase().includes(search) ||
        b.workshopName?.toLowerCase().includes(search)
    );
  }
  if (filters.date) {
    filteredBookings = filteredBookings.filter((b) =>
      dayjs(b.appointmentDate).isSame(filters.date, 'day')
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Bookings
        </Title>
        <Button icon={<ReloadOutlined />} onClick={loadBookings}>
          Refresh
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search bookings..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            value={filters.status || undefined}
            onChange={(v) => setFilters({ ...filters, status: v || '' })}
          >
            {Object.entries(BOOKING_STATUSES).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value.label}
              </Select.Option>
            ))}
          </Select>
          <DatePicker
            placeholder="Filter by date"
            value={filters.date}
            onChange={(date) => setFilters({ ...filters, date })}
          />
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      {/* Reschedule Modal */}
      <Modal
        title="Reschedule Booking"
        open={rescheduleModal.open}
        onCancel={() => {
          setRescheduleModal({ open: false, booking: null });
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleReschedule}>
          <Form.Item
            name="date"
            label="New Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item
            name="time"
            label="New Time Slot"
            rules={[{ required: true, message: 'Please select a time' }]}
          >
            <TimePicker format="HH:mm" minuteStep={30} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
