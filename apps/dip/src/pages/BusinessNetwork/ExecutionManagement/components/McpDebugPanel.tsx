import { Button, Input, message, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { debugMcp } from '@/apis';

const { TextArea } = Input;

interface Props {
  mcpId: string;
  toolName: string;
  canDebug: boolean;
}

const McpDebugPanel = ({ mcpId, toolName, canDebug }: Props) => {
  const [loading, setLoading] = useState(false);
  const [payloadText, setPayloadText] = useState('{}');
  const [result, setResult] = useState<any>(null);

  const disabled = useMemo(() => !canDebug || !mcpId || !toolName, [canDebug, mcpId, toolName]);

  const handleRun = async () => {
    if (disabled) return;
    let payload: Record<string, unknown> = {};
    try {
      payload = payloadText.trim() ? JSON.parse(payloadText) : {};
    } catch {
      message.error('请求参数不是合法 JSON');
      return;
    }

    setLoading(true);
    try {
      const data = await debugMcp(mcpId, toolName, payload);
      setResult(data);
      message.success('调试完成');
    } catch (error: any) {
      message.error(error?.description || '调试失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border rounded p-4">
      <Typography.Title level={5}>调试</Typography.Title>
      <Typography.Paragraph type="secondary">调用 MCP 工具调试接口（需已选中左侧工具）。</Typography.Paragraph>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <TextArea
          value={payloadText}
          onChange={e => setPayloadText(e.target.value)}
          rows={8}
          placeholder='例如：{"arguments":{}}'
        />
        <div>
          <Button type="primary" loading={loading} disabled={disabled} onClick={handleRun}>
            运行调试
          </Button>
        </div>
        <TextArea value={result ? JSON.stringify(result, null, 2) : ''} readOnly rows={10} placeholder="调试结果将显示在这里" />
      </Space>
    </div>
  );
};

export default McpDebugPanel;
