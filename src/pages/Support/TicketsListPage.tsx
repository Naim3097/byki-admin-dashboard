// Support Tickets List Page
import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  Space,
  Button,
  Typography,
  Tag,
  // Modal,
  // Form,
  message,
  Drawer,
  List,
  // Avatar,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { UserAvatar } from '../../components/Common/UserAvatar';
import { supportService } from '../../services/support.service';
import { SupportTicket, TicketStatus, TicketMessage } from '../../types/support';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { TICKET_STATUSES } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const TicketsListPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '' as TicketStatus | '',
  });

  useEffect(() => {
    loadTickets();
  }, [filters.status]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await supportService.getTickets({
        status: filters.status || undefined,
      });
      setTickets(data);
    } catch (error) {
      message.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      await supportService.updateTicketStatus(ticketId, status);
      message.success('Ticket status updated');
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        const updated = await supportService.getTicket(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    setSending(true);
    try {
      await supportService.addReply(selectedTicket.id, {
        senderId: user?.uid || '',
        senderName: user?.name || 'Admin',
        senderType: 'admin',
        message: replyText,
      });
      message.success('Reply sent');
      setReplyText('');
      
      // Reload ticket
      const updated = await supportService.getTicket(selectedTicket.id);
      setSelectedTicket(updated);
      loadTickets();
    } catch (error) {
      message.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const openTicketDetail = async (ticket: SupportTicket) => {
    const fullTicket = await supportService.getTicket(ticket.id);
    setSelectedTicket(fullTicket);
    setDrawerOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const columns: ColumnsType<SupportTicket> = [
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string, record) => (
        <Button type="link" onClick={() => openTicketDetail(record)}>
          {subject}
        </Button>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <UserAvatar name={record.userName} size="small" />
          <Text>{record.userName || record.userEmail || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TicketStatus) => <StatusBadge status={status} type="ticket" />,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => formatRelativeTime(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<MessageOutlined />}
            onClick={() => openTicketDetail(record)}
          >
            View
          </Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 110 }}
            onChange={(status) => handleStatusChange(record.id, status)}
          >
            {Object.entries(TICKET_STATUSES).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value.label}
              </Select.Option>
            ))}
          </Select>
        </Space>
      ),
    },
  ];

  // Filter tickets
  let filteredTickets = tickets;
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredTickets = filteredTickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(search) ||
        t.userName?.toLowerCase().includes(search) ||
        t.userEmail?.toLowerCase().includes(search)
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Support Tickets
        </Title>
        <Button icon={<ReloadOutlined />} onClick={loadTickets}>
          Refresh
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search tickets..."
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
            {Object.entries(TICKET_STATUSES).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value.label}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredTickets}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      {/* Ticket Detail Drawer */}
      <Drawer
        title={selectedTicket?.subject}
        placement="right"
        width={500}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTicket(null);
          setReplyText('');
        }}
        extra={
          selectedTicket && (
            <Select
              value={selectedTicket.status}
              style={{ width: 120 }}
              onChange={(status) => handleStatusChange(selectedTicket.id, status)}
            >
              {Object.entries(TICKET_STATUSES).map(([key, value]) => (
                <Select.Option key={key} value={key}>
                  {value.label}
                </Select.Option>
              ))}
            </Select>
          )
        }
      >
        {selectedTicket && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">From: </Text>
              <Text strong>{selectedTicket.userName || selectedTicket.userEmail}</Text>
              <br />
              <Text type="secondary">Created: </Text>
              <Text>{formatDateTime(selectedTicket.createdAt)}</Text>
              <br />
              <Text type="secondary">Priority: </Text>
              <Tag color={getPriorityColor(selectedTicket.priority)}>
                {selectedTicket.priority.toUpperCase()}
              </Tag>
            </div>

            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Paragraph>{selectedTicket.message}</Paragraph>
            </Card>

            <Divider>Conversation</Divider>

            <List
              dataSource={selectedTicket.messages || []}
              renderItem={(msg: TicketMessage) => (
                <List.Item
                  style={{
                    background: msg.senderType === 'admin' ? '#e6f7ff' : '#f5f5f5',
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                  }}
                >
                  <List.Item.Meta
                    avatar={<UserAvatar name={msg.senderName} size="small" />}
                    title={
                      <Space>
                        <Text strong>{msg.senderName}</Text>
                        <Tag>{msg.senderType}</Tag>
                      </Space>
                    }
                    description={
                      <>
                        <Paragraph style={{ margin: 0 }}>{msg.message}</Paragraph>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDateTime(msg.createdAt)}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider />

            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
              />
            </Space.Compact>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendReply}
              loading={sending}
              style={{ marginTop: 8 }}
              disabled={!replyText.trim()}
            >
              Send Reply
            </Button>
          </>
        )}
      </Drawer>
    </div>
  );
};
