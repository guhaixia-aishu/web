import { Alert, Button, Card, Empty, List, Space, Spin, Tag, Typography, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMCP, getMCPMarket, getMcpTools } from '@/apis';
import McpDebugPanel from '../components/McpDebugPanel';
import McpInfoPanel from '../components/McpInfoPanel';

const mergeMcpResponse = (raw: any) => {
  if (raw?.base_info && raw?.connection_info) {
    return { ...raw.base_info, ...raw.connection_info };
  }
  return raw;
};

const McpDetailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mcpId = searchParams.get('mcp_id') || '';
  const action = searchParams.get('action') || 'edit';

  const [loading, setLoading] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [mcpInfo, setMcpInfo] = useState<any>(null);
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);

  const isView = action === 'view';

  const loadMcp = useCallback(async () => {
    if (!mcpId) return;
    setLoading(true);
    try {
      const raw = isView ? await getMCPMarket({ mcp_id: mcpId }) : await getMCP({ mcp_id: mcpId });
      setMcpInfo(mergeMcpResponse(raw));
    } catch (error: any) {
      message.error(error?.description || '加载 MCP 详情失败');
    } finally {
      setLoading(false);
    }
  }, [mcpId, isView]);

  const loadTools = useCallback(async () => {
    if (!mcpId) return;
    setToolsLoading(true);
    try {
      const { tools: list } = await getMcpTools(mcpId);
      const next = list || [];
      setTools(next);
      setSelectedTool(next[0] || null);
    } catch (error: any) {
      message.error(error?.description || '获取工具列表失败');
      setTools([]);
      setSelectedTool(null);
    } finally {
      setToolsLoading(false);
    }
  }, [mcpId]);

  useEffect(() => {
    loadMcp();
  }, [loadMcp]);

  useEffect(() => {
    if (mcpId && mcpInfo?.url) {
      loadTools();
    } else if (mcpInfo && !mcpInfo.url) {
      setTools([]);
      setSelectedTool(null);
    }
  }, [mcpId, mcpInfo, loadTools]);

  if (!mcpId) {
    return (
      <div className="h-full w-full p-6">
        <Alert type="warning" showIcon message="缺少 mcp_id 参数，无法加载 MCP 详情。" />
      </div>
    );
  }

  const title = mcpInfo?.name || 'MCP 详情';

  return (
    <div className="h-full w-full p-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            {mcpInfo?.status ? <Tag className="mt-2">{mcpInfo.status}</Tag> : null}
          </div>
          <Space>
            <Button onClick={() => loadTools()} loading={toolsLoading}>
              刷新工具列表
            </Button>
            <Button onClick={() => navigate(-1)}>返回</Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          {mcpInfo?.url ? (
            <Typography.Paragraph type="secondary" className="mb-4">
              服务地址：{mcpInfo.url}
            </Typography.Paragraph>
          ) : null}

          {tools.length === 0 && !toolsLoading ? (
            <Empty
              description={
                mcpInfo && !mcpInfo.url
                  ? '当前 MCP 无服务地址，无法拉取工具列表'
                  : '暂无工具，可点击「刷新工具列表」重试'
              }
            />
          ) : (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 border rounded p-3 max-h-[560px] overflow-auto">
                <Spin spinning={toolsLoading}>
                  <List
                    dataSource={tools}
                    renderItem={(tool, index) => (
                      <List.Item
                        className="cursor-pointer"
                        onClick={() => setSelectedTool(tool)}
                        style={{
                          background: selectedTool?.name === tool.name ? 'rgba(22,119,255,0.08)' : undefined,
                          borderRadius: 6,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }}
                      >
                        <div style={{ width: '100%' }}>
                          <div className="flex items-center gap-2">
                            <Typography.Text type="secondary">{index + 1}</Typography.Text>
                            <span>{tool.name}</span>
                          </div>
                          <Typography.Text type="secondary" ellipsis>
                            {tool.description || '-'}
                          </Typography.Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Spin>
              </div>
              <div className="col-span-8 border rounded p-4 max-h-[560px] overflow-auto">
                {selectedTool ? (
                  <>
                    <McpInfoPanel selectedTool={{ ...selectedTool, mcp_id: mcpId }} />
                    {!isView ? (
                      <McpDebugPanel mcpId={mcpId} toolName={selectedTool.name} canDebug={Boolean(selectedTool.name)} />
                    ) : null}
                  </>
                ) : (
                  <Empty description="请从左侧选择工具" />
                )}
              </div>
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default McpDetailPage;
