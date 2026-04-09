import { Collapse, Switch, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import styles from './ToolInfoPanel.module.less';

const { Panel } = Collapse;

interface Props {
  selectedTool: any;
}

const notExistTip = '无法获取，底层算子已被删除';

const ToolInfoPanel = ({ selectedTool }: Props) => {
  const isExist = useMemo(() => Boolean(selectedTool?.metadata?.version), [selectedTool?.metadata?.version]);
  const inputSchema = selectedTool?.metadata?.input_schema || selectedTool?.inputs || {};
  const outputSchema = selectedTool?.metadata?.output_schema || selectedTool?.outputs || {};

  return (
    <div className={styles.wrap}>
      <Collapse ghost defaultActiveKey={['1']}>
        <Panel key="1" header="工具信息">
          <div className={styles.label}>工具名称</div>
          <div className={styles.value}>{selectedTool?.name || '-'}</div>

          <div className={styles.label}>工具描述</div>
          <div className={styles.value}>{selectedTool?.description || '暂无描述'}</div>

          <div className={styles.label}>工具规则</div>
          <div className={styles.value}>{selectedTool?.use_rule || '暂无规则'}</div>

          <div className={styles.label}>Server URL</div>
          <div className={`${styles.value} ${!isExist ? styles.error : ''}`}>
            {isExist ? selectedTool?.metadata?.server_url || '-' : notExistTip}
          </div>

          <div className={styles.label}>工具路径</div>
          <div className={`${styles.value} ${!isExist ? styles.error : ''}`}>
            {isExist ? selectedTool?.metadata?.path || '-' : notExistTip}
          </div>

          <div className="flex items-center gap-8">
            <span className={styles.label} style={{ marginBottom: 0 }}>
              请求方法
            </span>
            {isExist ? <Tag>{selectedTool?.metadata?.method || '-'}</Tag> : <span className={styles.error}>{notExistTip}</span>}
            <span className={styles.label} style={{ marginBottom: 0, marginLeft: 16 }}>
              工具状态
            </span>
            {isExist ? (
              <>
                <Switch size="small" value={selectedTool?.status !== 'disabled'} disabled />
                <Typography.Text>{selectedTool?.status === 'disabled' ? '未启用' : '已启用'}</Typography.Text>
              </>
            ) : (
              <span className={styles.error}>{notExistTip}</span>
            )}
          </div>
        </Panel>

        {isExist ? (
          <Panel key="2" header="输入输出">
            <div className={styles.label}>输入参数</div>
            <pre className={styles.jsonBox}>{JSON.stringify(inputSchema, null, 2)}</pre>
            <div className={styles.label} style={{ marginTop: 12 }}>
              输出参数
            </div>
            <pre className={styles.jsonBox}>{JSON.stringify(outputSchema, null, 2)}</pre>
          </Panel>
        ) : null}
      </Collapse>
    </div>
  );
};

export default ToolInfoPanel;
