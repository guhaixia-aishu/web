import { Avatar, Card, Col, Row, Space, Tag, Tooltip, Typography } from 'antd';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CardActionMenu from './CardActionMenu';
import styles from './OperatorCardList.module.less';

const { Title, Paragraph } = Typography;

type OperatorItem = {
  id?: string;
  operator_id?: string;
  mcp_id?: string;
  box_id?: string;
  name?: string;
  description?: string;
  status?: string;
  update_user?: string;
  release_user?: string;
  update_time?: string;
  is_internal?: boolean;
  tools?: unknown[];
  metadata_type?: string;
};

interface Props {
  activeTab: string;
  items: OperatorItem[];
  onRefresh: () => void;
}

const metadataTypeMap: Record<string, string> = {
  openapi: 'OpenAPI',
  adp: 'ADP',
};

const OperatorCardList = ({ activeTab, items, onRefresh }: Props) => {
  const navigate = useNavigate();
  const cols = useMemo(() => ({ xs: 24, sm: 12, md: 12, lg: 8, xl: 8, xxl: 6 }), []);

  const goDetail = (item: OperatorItem) => {
    if (activeTab === 'tool_box') {
      navigate(`./tool-detail?box_id=${item.box_id || ''}&action=edit`);
      return;
    }
    if (activeTab === 'operator') {
      navigate(`./operator-detail?operator_id=${item.operator_id || ''}&action=edit`);
      return;
    }
    navigate(`./mcp-detail?mcp_id=${item.mcp_id || ''}&action=edit`);
  };

  return (
    <Row gutter={[16, 16]}>
      {items.map(item => (
        <Col key={item.id || item.operator_id || item.mcp_id || item.box_id} {...cols}>
          <Card
            hoverable
            onClick={() => goDetail(item)}
            style={{ border: '1px solid #00000019', boxShadow: '0 2px 8px #00000016' }}
          >
            <div style={{ display: 'flex' }}>
              <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 8, background: '#f0f2f5' }}>
                {item.metadata_type ? (
                  <div className={styles.cardTag}>{metadataTypeMap[item.metadata_type] || item.metadata_type}</div>
                ) : null}
              </div>
              <div style={{ marginLeft: 12, width: 'calc(100% - 50px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Title ellipsis={{ rows: 1 }} level={5} title={item.name}>
                    {item.name || '-'}
                  </Title>
                  {item.status ? <Tag>{item.status}</Tag> : null}
                </div>
                <Paragraph ellipsis={{ rows: 2 }} className={styles.desc} title={item.description}>
                  {item.description || '暂无描述'}
                </Paragraph>
                {activeTab === 'tool_box' ? (
                  <div style={{ fontSize: 12, color: '#00000072' }}>{item.tools?.length || 0} 个工具</div>
                ) : null}
              </div>
            </div>
            <div className={styles.metaLine}>
              {item.is_internal ? (
                <span className="mr-[10px]">内置</span>
              ) : (
                <>
                  <Avatar size={24}>{(item.update_user || item.release_user || '-').charAt(0)}</Avatar>
                  <span className={styles.user}>{item.update_user || item.release_user || '-'}</span>
                </>
              )}
              <Tooltip title={item.update_time}>
                <span>更新时间：{item.update_time || '-'}</span>
              </Tooltip>
              <span style={{ marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
                <CardActionMenu activeTab={activeTab} record={item} onRefresh={onRefresh} />
              </span>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default OperatorCardList;
