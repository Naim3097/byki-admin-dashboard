// Vouchers Page
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Card,
  message,
  Modal,
  Form,
  Switch,
  Typography,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Popconfirm,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { vouchersService } from '../../services/vouchers.service';
import { Voucher } from '../../types/voucher';
import { formatDate, formatRM } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/helpers';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const VouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const data = await vouchersService.getVouchers();
      setVouchers(data);
    } catch (error) {
      message.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (voucherId: string) => {
    try {
      await vouchersService.deleteVoucher(voucherId);
      message.success('Voucher deleted');
      loadVouchers();
    } catch (error) {
      message.error('Failed to delete voucher');
    }
  };

  const handleToggleStatus = async (voucherId: string, isActive: boolean) => {
    try {
      await vouchersService.toggleVoucherStatus(voucherId, isActive);
      message.success(`Voucher ${isActive ? 'activated' : 'deactivated'}`);
      loadVouchers();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      const voucherData = {
        code: values.code as string,
        title: values.title as string,
        description: values.description as string || '',
        discountValue: values.discountValue as number,
        isPercentage: values.isPercentage as boolean,
        minSpend: values.minSpend as number | undefined,
        maxDiscount: values.maxDiscount as number | undefined,
        applicableCategories: values.applicableCategories as string[] | undefined,
        pointsCost: (values.pointsCost as number) || 0,
        isActive: values.isActive as boolean,
        validFrom: (values.validity as [dayjs.Dayjs, dayjs.Dayjs])[0].toDate(),
        validUntil: (values.validity as [dayjs.Dayjs, dayjs.Dayjs])[1].toDate(),
      };

      if (editingVoucher) {
        await vouchersService.updateVoucher(editingVoucher.id, voucherData as Partial<Voucher>);
        message.success('Voucher updated');
      } else {
        await vouchersService.createVoucher(voucherData as Omit<Voucher, 'id'>);
        message.success('Voucher created');
      }
      setEditorOpen(false);
      setEditingVoucher(null);
      form.resetFields();
      loadVouchers();
    } catch (error) {
      message.error('Failed to save voucher');
    }
  };

  const openEditor = (voucher?: Voucher) => {
    if (voucher) {
      setEditingVoucher(voucher);
      form.setFieldsValue({
        code: voucher.code,
        title: voucher.title,
        description: voucher.description,
        discountValue: voucher.discountValue,
        isPercentage: voucher.isPercentage,
        minSpend: voucher.minSpend,
        maxDiscount: voucher.maxDiscount,
        pointsCost: voucher.pointsCost,
        isActive: voucher.isActive,
        validity: [dayjs(voucher.validFrom), dayjs(voucher.validUntil)],
      });
    } else {
      setEditingVoucher(null);
      form.resetFields();
    }
    setEditorOpen(true);
  };

  const handleCopyCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      message.success('Code copied to clipboard');
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 14 }}>
            {code}
          </Tag>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyCode(code)}
          />
        </Space>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_: unknown, record: Voucher) => (
        <Text strong>
          {record.isPercentage
            ? `${record.discountValue}%`
            : formatRM(record.discountValue)}
        </Text>
      ),
    },
    {
      title: 'Points Cost',
      dataIndex: 'pointsCost',
      key: 'pointsCost',
      render: (points: number) => (
        <Text>{points > 0 ? `${points} pts` : '-'}</Text>
      ),
    },
    {
      title: 'Validity',
      key: 'validity',
      render: (_: unknown, record: Voucher) => {
        const isExpired = new Date(record.validUntil) < new Date();
        return (
          <Space direction="vertical" size={0}>
            <Text type={isExpired ? 'secondary' : undefined}>
              {formatDate(record.validFrom)} - {formatDate(record.validUntil)}
            </Text>
            {isExpired && <Tag color="red">Expired</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Min Spend',
      dataIndex: 'minSpend',
      key: 'minSpend',
      render: (minSpend: number | undefined) => (
        <Text>{minSpend ? formatRM(minSpend) : '-'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Voucher) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Voucher) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEditor(record)} />
          <Popconfirm title="Delete this voucher?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.code.toLowerCase().includes(searchText.toLowerCase()) ||
      v.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeVouchers = vouchers.filter(
    (v) => v.isActive && new Date(v.validUntil) > new Date()
  ).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Vouchers & Promotions
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
          Create Voucher
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="Total Vouchers" value={vouchers.length} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="Active" value={activeVouchers} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic 
              title="Expired" 
              value={vouchers.filter((v) => new Date(v.validUntil) <= new Date()).length} 
              valueStyle={{ color: '#ff4d4f' }} 
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search vouchers..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Card>

      <Table
        columns={columns}
        dataSource={filteredVouchers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Voucher Editor Modal */}
      <Modal
        title={editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
        open={editorOpen}
        onCancel={() => {
          setEditorOpen(false);
          setEditingVoucher(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Voucher Code"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input
                  placeholder="e.g., WELCOME20"
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="e.g., Welcome Discount" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Voucher description..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isPercentage"
                label="Percentage Discount?"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="%" unCheckedChildren="RM" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountValue"
                label="Discount Value"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="minSpend" label="Min Spend (RM)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxDiscount" label="Max Discount (RM)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pointsCost" label="Points Cost">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0 = free" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="validity"
            label="Validity Period"
            rules={[{ required: true, message: 'Required' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
