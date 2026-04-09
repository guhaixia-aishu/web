import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Select, Space } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postToolBox } from '@/apis';
import IconFont from '@/components/IconFont';
import ImportToolboxAndOperatorModal from './ImportToolboxAndOperatorModal';
import CreateMcpDrawer from './CreateMcpDrawer';

interface Props {
  activeTab: string;
  onRefresh: () => void;
}

const CreateAndImportBar = ({ activeTab, onRefresh }: Props) => {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const typeName = useMemo(() => {
    if (activeTab === 'operator') return '算子';
    if (activeTab === 'tool_box') return '工具箱';
    return 'MCP';
  }, [activeTab]);

  const handleCreate = async () => {
    if (activeTab === 'operator') {
      navigate('./ide/operator/create');
      return;
    }
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (activeTab === 'tool_box') {
        await postToolBox({
          box_name: values.name,
          box_desc: values.description,
          metadata_type: values.metadata_type || 'openapi',
        });
      }
      message.success(`新建${typeName}成功`);
      setCreateOpen(false);
      form.resetFields();
      onRefresh();
    } catch (error: any) {
      message.error(error?.description || `新建${typeName}失败`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建{typeName}
        </Button>
        {activeTab === 'mcp' ? (
          <Button icon={<IconFont type="icon-import" />} disabled>
            导入{typeName}
          </Button>
        ) : (
          <Button icon={<IconFont type="icon-import" />} onClick={() => setImportOpen(true)}>
            导入{typeName}
          </Button>
        )}
      </Space>

      <Modal
        title={`新建${typeName}`}
        open={createOpen && activeTab !== 'mcp'}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        okButtonProps={{ loading }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} maxLength={500} />
          </Form.Item>
          {activeTab === 'tool_box' ? (
            <Form.Item name="metadata_type" label="数据源类型" initialValue="openapi">
              <Select
                options={[
                  { value: 'openapi', label: 'OpenAPI' },
                  { value: 'adp', label: 'ADP' },
                ]}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      {activeTab === 'mcp' && createOpen ? (
        <CreateMcpDrawer
          open
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            onRefresh();
          }}
        />
      ) : null}

      {importOpen && (activeTab === 'tool_box' || activeTab === 'operator') ? (
        <ImportToolboxAndOperatorModal
          activeTab={activeTab}
          onCancel={() => setImportOpen(false)}
          onOk={() => {
            setImportOpen(false);
            onRefresh();
          }}
        />
      ) : null}
    </>
  );
};

export default CreateAndImportBar;
