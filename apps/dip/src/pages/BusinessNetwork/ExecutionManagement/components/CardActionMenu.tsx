import { EllipsisOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { boxToolStatus, delMCP, delOperator, delToolBox, mapReleaseAction, postOperatorStatus } from '@/apis';

interface Props {
  activeTab: string;
  record: any;
  onRefresh: () => void;
}

const CardActionMenu = ({ activeTab, record, onRefresh }: Props) => {
  const navigate = useNavigate();

  const goView = () => {
    if (activeTab === 'tool_box') {
      navigate(`./tool-detail?box_id=${record.box_id || ''}&action=edit`);
      return;
    }
    if (activeTab === 'operator') {
      navigate(`./operator-detail?operator_id=${record.operator_id || ''}&action=edit`);
      return;
    }
    navigate(`./mcp-detail?mcp_id=${record.mcp_id || ''}&action=edit`);
  };

  const updateStatus = async (status: 'published' | 'offline') => {
    try {
      if (activeTab === 'tool_box') {
        await boxToolStatus(record.box_id, { status });
      } else if (activeTab === 'operator') {
        await postOperatorStatus([{ operator_id: record.operator_id, status }]);
      } else {
        await mapReleaseAction(record.mcp_id, { status });
      }
      message.success(status === 'published' ? '发布成功' : '下架成功');
      onRefresh();
    } catch (error: any) {
      message.error(error?.description || '操作失败');
    }
  };

  const deleteItem = async () => {
    try {
      if (activeTab === 'tool_box') {
        await delToolBox({ box_id: record.box_id });
      } else if (activeTab === 'operator') {
        await delOperator([{ operator_id: record.operator_id, version: record.version }]);
      } else {
        await delMCP({ mcp_id: record.mcp_id });
      }
      message.success('删除成功');
      onRefresh();
    } catch (error: any) {
      message.error(error?.description || '删除失败');
    }
  };

  const confirmDelete = () =>
    Modal.confirm({
      title: '确认删除',
      content: '请确认是否删除当前条目？',
      centered: true,
      onOk: deleteItem,
    });

  const confirmOffline = () =>
    Modal.confirm({
      title: '确认下架',
      content: '下架后可能影响引用该资源的流程，是否继续？',
      centered: true,
      onOk: () => updateStatus('offline'),
    });

  const menu = (
    <Menu>
      <Menu.Item onClick={goView}>查看</Menu.Item>
      {record?.status !== 'published' ? <Menu.Item onClick={() => updateStatus('published')}>发布</Menu.Item> : null}
      {record?.status === 'published' ? <Menu.Item onClick={confirmOffline}>下架</Menu.Item> : null}
      <Menu.Item danger onClick={confirmDelete}>
        删除
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown trigger={['click']} overlay={menu}>
      <Button
        type="text"
        icon={<EllipsisOutlined />}
        onClick={e => {
          e.stopPropagation();
        }}
      />
    </Dropdown>
  );
};

export default CardActionMenu;
