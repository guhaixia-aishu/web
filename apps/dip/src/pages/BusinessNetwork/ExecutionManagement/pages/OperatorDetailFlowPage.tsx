import { Alert, Button, Card, Descriptions, Space, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * 对应 operator-web：`OperatorDetailFlow`（通过 qiankun 加载 `operator-flow-detail` 微件）。
 * 主应用内先展示 DAG / 日志参数，后续可在此容器挂载同能力微应用或内嵌页面。
 */
const OperatorDetailFlowPage = () => {
  const navigate = useNavigate();
  const { id, recordId } = useParams<{ id: string; recordId?: string }>();
  const isLog = Boolean(recordId);

  return (
    <div className="h-full w-full p-6">
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {isLog ? '执行日志' : '执行流程详情'}
            </Typography.Title>
            <Button onClick={() => navigate(-1)}>返回</Button>
          </div>

          <Alert
            type="info"
            showIcon
            message="说明"
            description="原 operator-web 在此通过微前端加载「operator-flow-detail」展示 DAG/日志。主应用侧可先对接口与路由参数联调；需要可视化时再将微应用或等价页面挂到下方预留区域。"
          />

          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="DAG / 流程 id">{id ?? '-'}</Descriptions.Item>
            {isLog ? <Descriptions.Item label="日志 recordId">{recordId}</Descriptions.Item> : null}
          </Descriptions>

          <div
            id="operator-flow-detail-host"
            className="min-h-[320px] rounded border border-dashed border-gray-300 bg-[#fafafa] flex items-center justify-center text-gray-500 text-sm p-4"
          >
            流程可视化挂载点（预留）
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default OperatorDetailFlowPage;
