import { Button, Drawer, Empty, Form, Input, message, Radio, Select, Table, Tooltip } from 'antd';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOperatorCategory, mcpSSE, postMCP } from '@/apis';
// import operatorEmpty from '@/assets/images/abnormal/operator-empty.png';
import OperatorEmptyIcon from '@/assets/images/abnormal/operator-empty.svg?react';
import AddToolsModal from './AddToolsModal';

enum McpCreationTypeEnum {
  Custom = 'custom',
  ToolImported = 'tool_imported',
}

enum McpModeTypeEnum {
  SSE = 'sse',
  Stream = 'streamable',
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateMcpDrawer = ({ open, onClose, onSuccess }: Props) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [creationType, setCreationType] = useState<string>(McpCreationTypeEnum.Custom);
  const [categoryType, setCategoryType] = useState<Array<{ category_type: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [headerRows, setHeaderRows] = useState<Array<{ id: number; key: string; value: string }>>([]);
  const [pickToolsOpen, setPickToolsOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchConfig = async () => {
      try {
        const data = await getOperatorCategory();
        setCategoryType(data || []);
        form.setFieldsValue({
          mode: McpModeTypeEnum.SSE,
          creation_type: McpCreationTypeEnum.Custom,
          category: data?.[0]?.category_type,
        });
        setHeaderRows([]);
        setDataSource([]);
        setPickToolsOpen(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchConfig();
  }, [open, form]);

  const onFinish = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();
    if (values.creation_type === McpCreationTypeEnum.ToolImported && dataSource.length === 0) {
      message.error('请先添加至少一个工具');
      return;
    }
    const headers =
      headerRows.length > 0
        ? headerRows.reduce(
            (acc, cur) => {
              const key = cur.key.trim();
              if (key) {
                acc[key] = cur.value;
              }
              return acc;
            },
            {} as Record<string, string>
          )
        : undefined;
    const payload = {
      ...values,
      tool_configs: dataSource,
      ...(headers && Object.keys(headers).length > 0 ? { headers } : {}),
    };

    setLoading(true);
    try {
      const result: any = await postMCP(payload);
      const mcpId = result?.mcp_id;
      message.success('创建成功');
      onClose();
      onSuccess?.();
      if (mcpId) {
        navigate(`./mcp-detail?mcp_id=${mcpId}&action=edit`);
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error.description);
      }
    } finally {
      setLoading(false);
    }
  };

  const parseFromUrl = async () => {
    await form.validateFields(['url']);
    try {
      const { url, mode } = form.getFieldsValue();
      let headers: Record<string, string> | undefined;
      if (headerRows.length > 0) {
        headers = headerRows.reduce(
          (acc, cur) => {
            if (cur.key.trim()) {
              acc[cur.key.trim()] = cur.value;
            }
            return acc;
          },
          {} as Record<string, string>
        );
      }
      const { tools } = await mcpSSE({ url, mode, headers });
      setDataSource(tools || []);
    } catch (error: any) {
      if (error?.description) {
        message.error(error.description);
      }
    }
  };

  const handleConfirmAddTools = (selected: any[]) => {
    if (selected.length === 0) {
      message.info('请先选择工具');
      return;
    }
    const merged = [...dataSource];
    const existIds = new Set(merged.map(item => item.tool_id || item.name));
    selected.forEach(tool => {
      const key = tool.tool_id || tool.name;
      if (!existIds.has(key)) {
        merged.push(tool);
        existIds.add(key);
      }
    });
    setDataSource(merged);
    setPickToolsOpen(false);
  };

  return (
    <Drawer
      title="新建MCP服务"
      open={open}
      onClose={onClose}
      size={800}
      mask={{ closable: false }}
      destroyOnHidden
      footer={
        <div className="text-right">
          <Button type="primary" className="w-[74px] mr-[8px]" loading={loading} onClick={onFinish}>
            确定
          </Button>
          <Button className="w-[74px]" onClick={onClose}>
            取消
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={changed => changed?.creation_type && setCreationType(changed.creation_type)}
      >
        <Form.Item label="新建方式" name="creation_type">
          <Radio.Group
            onChange={() => {
              setDataSource([]);
            }}
          >
            <Radio value={McpCreationTypeEnum.Custom}>连接已有MCP服务</Radio>
            <Radio value={McpCreationTypeEnum.ToolImported}>
              从工具箱添加
              <Tooltip title="您可以从工具箱添加工具，以MCP协议对外提供使用（待迁移）">
                <QuestionCircleOutlined className="ml-[8px] text-[rgba(0,0,0,0.35)] text-[16px]" />
              </Tooltip>
            </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="MCP 服务名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
          <Input maxLength={50} placeholder="请输入" />
        </Form.Item>

        <Form.Item label="MCP 服务描述" name="description" rules={[{ required: true, message: '请输入描述' }]}>
          <TextArea rows={4} placeholder="请输入" />
        </Form.Item>

        <Form.Item label="MCP 服务类型" name="category" rules={[{ required: true, message: '请选择服务类型' }]}>
          <Select options={(categoryType || []).map(item => ({ value: item.category_type, label: item.name }))} />
        </Form.Item>

        {creationType === McpCreationTypeEnum.Custom ? (
          <>
            <Form.Item label="通信模式" name="mode">
              <Select
                options={[
                  { value: McpModeTypeEnum.SSE, label: 'SSE' },
                  { value: McpModeTypeEnum.Stream, label: 'Streamable' },
                ]}
              />
            </Form.Item>

            <Form.Item label="URL" required>
              <div className="flex items-center gap-[12px]">
                <Form.Item
                  name="url"
                  className="dip-flex-1 dip-mb-0 flex-1"
                  style={{ marginBottom: 0, flex: 1 }}
                  rules={[{ required: true, message: '请输入' }]}
                >
                  <Input placeholder="请输入" />
                </Form.Item>
                <Button className="w-[74px]" onClick={parseFromUrl}>
                  解析
                </Button>
              </div>
            </Form.Item>

            <Form.Item label="Header列表">
              <div>
                {headerRows.length > 0 ? (
                  <div
                    style={{
                      width: '100%',
                      borderTop: '1px solid #f0f0f0',
                      borderBottom: '1px solid #f0f0f0',
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 72px',
                        columnGap: 16,
                        background: '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: 6,
                        marginBottom: 8,
                        fontWeight: 500,
                        color: 'rgba(0,0,0,0.85)',
                      }}
                    >
                      <div>Key</div>
                      <div>Value</div>
                      <div style={{ textAlign: 'center' }}>操作</div>
                    </div>
                    {headerRows.map(row => (
                      <div
                        key={row.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 72px',
                          columnGap: 16,
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <Input
                          placeholder="请输入"
                          value={row.key}
                          onChange={e => {
                            const value = e.target.value;
                            setHeaderRows(prev =>
                              prev.map(item => (item.id === row.id ? { ...item, key: value } : item))
                            );
                          }}
                        />
                        <Input
                          placeholder="请输入"
                          value={row.value}
                          onChange={e => {
                            const value = e.target.value;
                            setHeaderRows(prev => prev.map(item => (item.id === row.id ? { ...item, value } : item)));
                          }}
                        />
                        <Button
                          type="link"
                          className="pl-0"
                          onClick={() => {
                            setHeaderRows(prev => prev.filter(item => item.id !== row.id));
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  className="pl-0"
                  onClick={() => {
                    setHeaderRows(prev => [...prev, { id: Date.now(), key: '', value: '' }]);
                  }}
                >
                  添加
                </Button>
              </div>
            </Form.Item>
          </>
        ) : null}

        <Form.Item label="工具列表">
          {creationType === McpCreationTypeEnum.ToolImported ? (
            <div style={{ marginBottom: 8 }}>
              <Button type="link" icon={<PlusOutlined />} className="pl-0" onClick={() => setPickToolsOpen(true)}>
                添加工具
              </Button>
            </div>
          ) : null}
          <Table
            dataSource={dataSource}
            rowKey={(row: any, idx) => row?.tool_id || row?.name || String(idx)}
            columns={[
              { title: '名称', dataIndex: 'name', key: 'name' },
              { title: '描述', dataIndex: 'description', key: 'description' },
            ]}
            bordered
            size="small"
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  image={<OperatorEmptyIcon style={{ fontSize: 108 }} />}
                  description="暂无数据，请先解析URL地址"
                  styles={{
                    description: {
                      marginBottom: 24,
                    },
                  }}
                />
              ),
            }}
          />
        </Form.Item>
      </Form>
      {pickToolsOpen ? (
        <AddToolsModal
          open={pickToolsOpen}
          onCancel={() => setPickToolsOpen(false)}
          onConfirm={handleConfirmAddTools}
        />
      ) : null}
    </Drawer>
  );
};

export default CreateMcpDrawer;
