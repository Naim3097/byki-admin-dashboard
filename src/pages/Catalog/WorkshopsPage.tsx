// Workshops Page
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
  Rate,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { workshopsService } from '../../services/workshops.service';
import { Workshop } from '../../types/workshop';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const WorkshopsPage: React.FC = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    setLoading(true);
    try {
      const data = await workshopsService.getWorkshops();
      setWorkshops(data);
    } catch (error) {
      message.error('Failed to load workshops');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workshopId: string) => {
    try {
      await workshopsService.deleteWorkshop(workshopId);
      message.success('Workshop deleted');
      loadWorkshops();
    } catch (error) {
      message.error('Failed to delete workshop');
    }
  };

  const handleToggleStatus = async (workshopId: string, isActive: boolean) => {
    try {
      await workshopsService.toggleWorkshopStatus(workshopId, isActive);
      message.success(`Workshop ${isActive ? 'activated' : 'deactivated'}`);
      loadWorkshops();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleSave = async (values: Partial<Workshop>) => {
    try {
      if (editingWorkshop) {
        await workshopsService.updateWorkshop(editingWorkshop.id, values);
        message.success('Workshop updated');
      } else {
        await workshopsService.createWorkshop({
          ...values,
          latitude: 0,
          longitude: 0,
          services: [],
          operatingHours: [],
          rating: 0,
          reviewCount: 0,
          isActive: true,
        } as Omit<Workshop, 'id' | 'createdAt' | 'updatedAt'>);
        message.success('Workshop created');
      }
      setEditorOpen(false);
      setEditingWorkshop(null);
      form.resetFields();
      loadWorkshops();
    } catch (error) {
      message.error('Failed to save workshop');
    }
  };

  const openEditor = (workshop?: Workshop) => {
    if (workshop) {
      setEditingWorkshop(workshop);
      form.setFieldsValue(workshop);
    } else {
      setEditingWorkshop(null);
      form.resetFields();
    }
    setEditorOpen(true);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Workshop) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <EnvironmentOutlined /> {record.address}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: unknown, record: Workshop) => (
        <Space direction="vertical" size={0}>
          <Text>
            <PhoneOutlined /> {record.phone}
          </Text>
          {record.email && <Text type="secondary">{record.email}</Text>}
        </Space>
      ),
    },
    {
      title: 'Services',
      dataIndex: 'services',
      key: 'services',
      render: (services: string[]) => (
        <Space wrap>
          {services.slice(0, 3).map((s, i) => (
            <Tag key={i}>{s}</Tag>
          ))}
          {services.length > 3 && <Tag>+{services.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Rating',
      key: 'rating',
      render: (_: unknown, record: Workshop) => (
        <Space>
          <Rate disabled defaultValue={record.rating} allowHalf style={{ fontSize: 14 }} />
          <Text type="secondary">({record.reviewCount})</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Workshop) => (
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
      render: (_: unknown, record: Workshop) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEditor(record)} />
          <Popconfirm title="Delete this workshop?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredWorkshops = workshops.filter(
    (w) =>
      w.name.toLowerCase().includes(searchText.toLowerCase()) ||
      w.address.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Workshops
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
          Add Workshop
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search workshops..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Card>

      <Table
        columns={columns}
        dataSource={filteredWorkshops}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Workshop Editor Modal */}
      <Modal
        title={editingWorkshop ? 'Edit Workshop' : 'Add New Workshop'}
        open={editorOpen}
        onCancel={() => {
          setEditorOpen(false);
          setEditingWorkshop(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Workshop Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., BYKI Service Center - Petaling Jaya" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Workshop description..." />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Required' }]}
          >
            <TextArea rows={2} placeholder="Full address..." />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., 03-1234 5678" />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input placeholder="workshop@example.com" />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
