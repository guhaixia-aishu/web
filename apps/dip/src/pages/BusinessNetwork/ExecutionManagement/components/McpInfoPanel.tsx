import { Collapse, Typography } from 'antd';
import styles from './ToolInfoPanel.module.less';

const { Panel } = Collapse;

interface Props {
  selectedTool: any;
}

const McpInfoPanel = ({ selectedTool }: Props) => {
  const inputSchema = selectedTool?.inputSchema || selectedTool?.input_schema || {};

  return (
    <div className={styles.wrap}>
      <Collapse ghost defaultActiveKey={['1']}>
        <Panel key="1" header="工具信息">
          <div className={styles.label}>工具名称</div>
          <div className={styles.value}>{selectedTool?.name || '-'}</div>
          <div className={styles.label}>工具描述</div>
          <div className={styles.value}>{selectedTool?.description || '暂无描述'}</div>
        </Panel>
        <Panel key="2" header="输入" forceRender>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            输入 schema（来自 MCP 工具定义）
          </Typography.Paragraph>
          <pre className={styles.jsonBox}>{JSON.stringify(inputSchema, null, 2)}</pre>
        </Panel>
      </Collapse>
    </div>
  );
};

export default McpInfoPanel;
