import { Alert, Button, Card, Spin, Typography, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOperatorInfo, getOperatorMarketInfo } from '@/apis';
import OperatorDebugPanel from '../components/OperatorDebugPanel';
import OperatorInfoPanel from '../components/OperatorInfoPanel';

const OperatorDetailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const operatorId = searchParams.get('operator_id') || '';
  const action = searchParams.get('action') || 'edit';

  const [loading, setLoading] = useState(false);
  const [operatorInfo, setOperatorInfo] = useState<any>(null);

  const isView = action === 'view';

  const loadData = useCallback(async () => {
    if (!operatorId) return;
    setLoading(true);
    try {
      const data = isView
        ? await getOperatorMarketInfo({ operator_id: operatorId })
        : await getOperatorInfo({ operator_id: operatorId });
      setOperatorInfo(data);
    } catch (error: any) {
      message.error(error?.description || '加载算子详情失败');
    } finally {
      setLoading(false);
    }
  }, [operatorId, isView]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!operatorId) {
    return (
      <div className="h-full w-full p-6">
        <Alert type="warning" showIcon message="缺少 operator_id 参数，无法加载算子详情。" />
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {operatorInfo?.name || '算子详情'}
          </Typography.Title>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>

        <Spin spinning={loading}>
          {operatorInfo ? (
            <>
              <OperatorInfoPanel operatorInfo={operatorInfo} />
              {!isView ? <OperatorDebugPanel operatorInfo={operatorInfo} canDebug /> : null}
            </>
          ) : (
            !loading && <Typography.Text type="secondary">暂无数据</Typography.Text>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default OperatorDetailPage;
