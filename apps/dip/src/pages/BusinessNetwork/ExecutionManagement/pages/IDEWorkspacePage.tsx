import { Alert, Button, Card, Descriptions, Space, Typography } from 'antd';
import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

/**
 * 对应 operator-web：`IDEWorkspace`（Monaco / 算子与工具编辑）。
 * 子应用内为独立路由；迁入主应用后先展示参数与说明，后续可接 MicroAppComponent 或迁移编辑器组件。
 */
const IDEWorkspacePage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toolboxId, toolId, operatorId } = useParams<{
    toolboxId?: string;
    toolId?: string;
    operatorId?: string;
  }>();

  const title = useMemo(() => {
    if (pathname.includes('/ide/operator/create')) return '新建算子（IDE）';
    if (pathname.includes('/ide/operator/') && pathname.includes('/edit')) return '编辑算子（IDE）';
    if (pathname.includes('/tool/create')) return '新建工具（IDE）';
    if (pathname.includes('/tool/') && pathname.includes('/edit')) return '编辑工具（IDE）';
    return 'IDE 工作区';
  }, [pathname]);

  return (
    <div className="h-full w-full p-6">
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            <Button onClick={() => navigate(-1)}>返回</Button>
          </div>

          <Alert
            type="info"
            showIcon
            message="说明"
            description="原 operator-web 在独立子应用中加载 IDEWorkspace（含 Monaco 等）。主应用内可继续用 qiankun 加载 operator-web 对应 entry，或将编辑器模块迁入 dip；此处先保留路由与参数以便联调。"
          />

          <Descriptions bordered size="small" column={1}>
            {toolboxId != null ? (
              <Descriptions.Item label="toolboxId">{toolboxId}</Descriptions.Item>
            ) : null}
            {toolId != null ? <Descriptions.Item label="toolId">{toolId}</Descriptions.Item> : null}
            {operatorId != null ? <Descriptions.Item label="operatorId">{operatorId}</Descriptions.Item> : null}
            <Descriptions.Item label="当前路径">{pathname}</Descriptions.Item>
          </Descriptions>

          <div
            id="operator-ide-host"
            className="min-h-[400px] rounded border border-dashed border-gray-300 bg-[#fafafa] flex items-center justify-center text-gray-500 text-sm p-4 text-center"
          >
            IDE 编辑器挂载点（预留）
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default IDEWorkspacePage;
