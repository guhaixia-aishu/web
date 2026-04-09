import { Alert, Button, Card, Empty, List, Spin, Tag, Typography, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getToolBox, getToolBoxMarket, getToolDetail, getToolList } from '@/apis';
import ToolDebugPanel from '../components/ToolDebugPanel';
import ToolInfoPanel from '../components/ToolInfoPanel';

const ToolDetailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const boxId = searchParams.get('box_id') || '';
  const action = searchParams.get('action') || 'edit';

  const [loading, setLoading] = useState(false);
  const [toolboxInfo, setToolboxInfo] = useState<any>(null);
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);

  const isView = action === 'view';

  const loadData = useCallback(async () => {
    if (!boxId) return;
    setLoading(true);
    try {
      const boxInfo = isView ? await getToolBoxMarket({ box_id: boxId }) : await getToolBox({ box_id: boxId });
      setToolboxInfo(boxInfo);

      const list = await getToolList({ box_id: boxId, page: 1, page_size: 50 });
      setTools(list?.tools || []);
      if (list?.tools?.length) {
        const first = list.tools[0];
        const detail = await getToolDetail(boxId, first.tool_id);
        setSelectedTool(detail);
      } else {
        setSelectedTool(null);
      }
    } catch (error: any) {
      message.error(error?.description || '加载工具详情失败');
    } finally {
      setLoading(false);
    }
  }, [boxId, isView]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadToolDetail = async (tool: any) => {
    try {
      const detail = await getToolDetail(boxId, tool.tool_id);
      setSelectedTool(detail);
    } catch (error: any) {
      message.error(error?.description || '加载工具详情失败');
    }
  };

  const title = useMemo(() => toolboxInfo?.box_name || '工具详情', [toolboxInfo?.box_name]);

  if (!boxId) {
    return (
      <div className="h-full w-full p-6">
        <Alert type="warning" showIcon message="缺少 box_id 参数，无法加载工具详情。" />
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>
        <Typography.Paragraph type="secondary">{toolboxInfo?.box_desc || '暂无描述'}</Typography.Paragraph>
        <Spin spinning={loading}>
          {tools.length === 0 ? (
            <Empty description="暂无工具" />
          ) : (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 border rounded p-3 max-h-[560px] overflow-auto">
                <List
                  dataSource={tools}
                  renderItem={tool => (
                    <List.Item
                      className="cursor-pointer"
                      onClick={() => loadToolDetail(tool)}
                      style={{
                        background: selectedTool?.tool_id === tool.tool_id ? 'rgba(22,119,255,0.08)' : undefined,
                        borderRadius: 6,
                        paddingLeft: 8,
                        paddingRight: 8,
                      }}
                    >
                      <div style={{ width: '100%' }}>
                        <div className="flex items-center justify-between">
                          <span>{tool.name}</span>
                          {tool.status ? <Tag>{tool.status}</Tag> : null}
                        </div>
                        <Typography.Text type="secondary" ellipsis>
                          {tool.description || '-'}
                        </Typography.Text>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
              <div className="col-span-8 border rounded p-4 max-h-[560px] overflow-auto">
                {selectedTool ? (
                  <>
                    <Typography.Title level={5}>{selectedTool?.name || '工具详情'}</Typography.Title>
                    <Typography.Paragraph type="secondary">{selectedTool?.description || '暂无描述'}</Typography.Paragraph>
                    <ToolInfoPanel selectedTool={selectedTool} />
                    {action !== 'view' ? <ToolDebugPanel boxId={boxId} selectedTool={selectedTool} /> : null}
                  </>
                ) : (
                  <Empty description="请选择一个工具查看详情" />
                )}
              </div>
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ToolDetailPage;
