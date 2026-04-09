import { Collapse, Tag, Typography } from 'antd';
import styles from './ToolInfoPanel.module.less';

const { Panel } = Collapse;

interface Props {
  operatorInfo: any;
}

const OperatorInfoPanel = ({ operatorInfo }: Props) => {
  const meta = operatorInfo?.metadata || {};
  const inputSchema = meta.input_schema || operatorInfo?.inputs || {};
  const outputSchema = meta.output_schema || operatorInfo?.outputs || {};

  return (
    <div className={styles.wrap}>
      <Collapse ghost defaultActiveKey={['1']}>
        <Panel key="1" header="算子信息">
          <div className={styles.label}>算子名称</div>
          <div className={styles.value}>{operatorInfo?.name || '-'}</div>

          <div className={styles.label}>算子描述</div>
          <div className={styles.value}>{meta.description || '暂无描述'}</div>

          <div className={styles.label}>Server URL</div>
          <div className={styles.value}>{meta.server_url || '-'}</div>

          <div className={styles.label}>算子路径</div>
          <div className={styles.value}>{meta.path || '-'}</div>

          <div className="flex items-center gap-2">
            <span className={styles.label} style={{ marginBottom: 0 }}>
              请求方法
            </span>
            <Tag>{meta.method || '-'}</Tag>
            {operatorInfo?.status ? <Tag>{operatorInfo.status}</Tag> : null}
          </div>
        </Panel>

        <Panel key="2" header="输入输出" forceRender>
          <div className={styles.label}>输入参数</div>
          <pre className={styles.jsonBox}>{JSON.stringify(inputSchema, null, 2)}</pre>
          <div className={styles.label} style={{ marginTop: 12 }}>
            输出参数
          </div>
          <pre className={styles.jsonBox}>{JSON.stringify(outputSchema, null, 2)}</pre>
        </Panel>
      </Collapse>
    </div>
  );
};

export default OperatorInfoPanel;
