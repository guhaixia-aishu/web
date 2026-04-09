import { Input, message, Modal, Popover, Space, Spin, Tree } from 'antd';
import { DownOutlined, LoadingOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import classNames from 'classnames';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import IconFont from '@/components/IconFont';
import { getGlobalMarketToolList, getToolBoxMarketList, getToolList } from '@/apis';
import { getInputParamsFromOpenAPISpec } from '../utils/getInputParamsFromOpenAPISpec';
import styles from './AddToolsModal.module.less';

function enrichToolsWithInputs(tools: any[], boxMeta: any) {
  const global_headers = boxMeta?.global_headers || {};
  const headers = Object.keys(global_headers).map(headerItem => ({
    input_name: headerItem,
    input_type: 'string',
  }));
  return tools.map((item: any) => {
    const allInputs = getInputParamsFromOpenAPISpec(item.metadata?.api_spec);
    return {
      ...item,
      tool_input: _.uniqBy([...allInputs, ...headers], 'input_name'),
    };
  });
}

function renderParamPopoverContent(param: any[]) {
  return (
    <div style={{ width: 428, padding: 16, maxHeight: 400, overflow: 'auto' }}>
      {param?.map((item: any, index: number) => (
        <div key={item.input_name} className={classNames({ [styles.paramItemGap]: index !== param.length - 1 })}>
          <div>
            <span className={styles.paramName}>{item.input_name}</span>
            <span className={styles.paramMeta}>{item.input_type}</span>
            {item.required && <span className={styles.paramRequired}>必填</span>}
          </div>
          {item.input_desc && (
            <div className={styles.paramDesc} title={item.input_desc}>
              {item.input_desc}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: (tools: any[]) => void;
}

const AddToolsModal = ({ open, onCancel, onConfirm }: Props) => {
  const [toolboxOptions, setToolboxOptions] = useState<any[]>([]);
  const [defaultToolboxOptions, setDefaultToolboxOptions] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pickToolsLoading, setPickToolsLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loadingBoxIds, setLoadingBoxIds] = useState<string[]>([]);
  const [boxToolsMap, setBoxToolsMap] = useState<Record<string, any[]>>({});
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const getBoxMeta = useCallback(
    (boxId: string) =>
      (toolboxOptions || []).find((b: any) => b.box_id === boxId) ??
      defaultToolboxOptions.find((b: any) => b.box_id === boxId),
    [toolboxOptions, defaultToolboxOptions]
  );

  const getBoxKey = (boxId: string) => `box:${boxId}`;
  const getToolKey = (boxId: string, toolId: string) => `tool:${boxId}:${toolId}`;
  const parseBoxId = (key: string) => key.replace(/^box:/, '');

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setPickToolsLoading(true);
      try {
        const toolboxResp = await getToolBoxMarketList({ page: 1, status: 'published', all: true });
        const toolboxes = toolboxResp?.data || [];
        setDefaultToolboxOptions(toolboxes);
        setToolboxOptions(toolboxes);
      } catch (error: any) {
        message.error(error?.description || '加载工具箱列表失败');
        setDefaultToolboxOptions([]);
        setToolboxOptions([]);
      } finally {
        setPickToolsLoading(false);
      }
    };
    load();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const keyword = searchKeyword.trim();
    if (!keyword) {
      setToolboxOptions(defaultToolboxOptions);
      setExpandedKeys([]);
      return;
    }

    const timer = setTimeout(async () => {
      setPickToolsLoading(true);
      try {
        const resp = await getGlobalMarketToolList({
          sort_by: 'create_time',
          sort_order: 'desc',
          tool_name: keyword,
          status: 'enabled',
          all: true,
        });
        const boxes = resp?.data || [];
        setToolboxOptions(boxes);
        setExpandedKeys(boxes.map((item: any) => getBoxKey(item.box_id)).filter(Boolean));
        const nextMap: Record<string, any[]> = {};
        boxes.forEach((box: any) => {
          if (Array.isArray(box.tools)) {
            nextMap[box.box_id] = enrichToolsWithInputs(box.tools, box);
          }
        });
        if (Object.keys(nextMap).length > 0) {
          setBoxToolsMap(prev => ({ ...prev, ...nextMap }));
        }
      } catch (error: any) {
        message.error(error?.description || '搜索工具失败');
      } finally {
        setPickToolsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword, open, defaultToolboxOptions]);

  const loadToolsByBoxId = async (boxId: string) => {
    setLoadingBoxIds(prev => (prev.includes(boxId) ? prev : [...prev, boxId]));
    try {
      const resp = await getToolList({ box_id: boxId, page: 1, page_size: 100, status: 'enabled', all: true });
      const tools = resp?.tools || [];
      const boxMeta = getBoxMeta(boxId);
      const enriched = enrichToolsWithInputs(tools, boxMeta);
      setBoxToolsMap(prev => ({ ...prev, [boxId]: enriched }));
      return enriched;
    } catch (error: any) {
      message.error(error?.description || '加载工具列表失败');
      setBoxToolsMap(prev => ({ ...prev, [boxId]: [] }));
      return [];
    } finally {
      setLoadingBoxIds(prev => prev.filter(id => id !== boxId));
    }
  };

  const treeData = useMemo<DataNode[]>(() => {
    return (toolboxOptions || []).map((box: any) => {
      const boxId = box.box_id;
      const tools = boxToolsMap[boxId];
      const children: DataNode[] | undefined = tools?.map((tool: any) => {
        const toolInput = tool.tool_input as any[] | undefined;
        const previewInputs = toolInput?.slice(0, 3) ?? [];
        return {
          key: getToolKey(boxId, tool.tool_id),
          title: (
            <div className="max-w-[600px]">
              <div title={tool.name || '-'} className={styles.ellipsis}>
                {tool.name || '-'}
              </div>
              <div title={tool.description || '-'} className={`${styles.ellipsis} ${styles.descriptionText}`}>
                {tool.description || '-'}
              </div>
              {!!toolInput?.length && (
                <div className={styles.toolParamsRow}>
                  {previewInputs.map((inputItem: any) => (
                    <span key={inputItem.input_name} title={inputItem.input_name} className={styles.paramChip}>
                      {inputItem.input_name}
                    </span>
                  ))}
                  <Popover
                    overlayClassName={styles.paramPopover}
                    content={renderParamPopoverContent(toolInput)}
                    trigger={['hover']}
                    destroyOnHidden
                    placement="bottomLeft"
                    getPopupContainer={n => (n?.parentElement as HTMLElement) ?? document.body}
                  >
                    <span className={styles.paramLink}>参数</span>
                  </Popover>
                </div>
              )}
            </div>
          ),
          isLeaf: true,
        };
      });
      return {
        key: getBoxKey(boxId),
        title: (
          <div className="flex items-center gap-2">
            <IconFont type="icon-toolbox" style={{ fontSize: 32 }} />
            <div style={{ maxWidth: 590 }}>
              <div className={styles.ellipsis} title={box.box_name || box.name || boxId}>
                {box.box_name || box.name || boxId}
              </div>
              <div className={`${styles.ellipsis} ${styles.descriptionText}`} title={box.box_desc || '暂无描述'}>
                {box.box_desc || '暂无描述'}
              </div>
            </div>
          </div>
        ),
        isLeaf: false,
        children,
      } as DataNode;
    });
  }, [toolboxOptions, boxToolsMap]);

  const handleExpand = (nextExpandedKeys: React.Key[], info: { node: DataNode; expanded: boolean }) => {
    const normalizedKeys = nextExpandedKeys.map(key => String(key));
    setExpandedKeys(normalizedKeys);
    if (!info.expanded) return;
    const nodeKey = String(info.node.key);
    if (!nodeKey.startsWith('box:')) return;
    const boxId = parseBoxId(nodeKey);
    if (!boxToolsMap[boxId]) {
      loadToolsByBoxId(boxId);
    }
  };

  const handleConfirm = () => {
    const checkedToolKeys = checkedKeys.filter(key => key.startsWith('tool:'));
    const selected = checkedToolKeys
      .map(key => {
        const [, boxId, toolId] = key.split(':');
        const tools = boxToolsMap[boxId] || [];
        return tools.find((tool: any) => String(tool.tool_id) === toolId);
      })
      .filter(Boolean);
    if (selected.length === 0) {
      message.info('请先选择工具');
      return;
    }
    onConfirm(selected);
  };

  return (
    <Modal
      title="添加工具"
      open={open}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="确定"
      cancelText="取消"
      width={760}
      okButtonProps={{
        className: 'w-[74px]',
      }}
      cancelButtonProps={{
        className: 'w-[74px]',
      }}
    >
      <Space orientation="vertical" style={{ width: '100%' }} size={12}>
        <Input
          placeholder="搜索工具名称"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          allowClear
        />
        <div className={styles.addToolsModal} style={{ maxHeight: 420, overflowY: 'auto', padding: 8 }}>
          {pickToolsLoading ? (
            <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin />
            </div>
          ) : (
            <Tree
              checkable
              treeData={treeData}
              expandedKeys={expandedKeys}
              checkedKeys={checkedKeys}
              onExpand={handleExpand}
              onCheck={keys => setCheckedKeys((keys as React.Key[]).map(key => String(key)))}
              switcherIcon={(node: any) => {
                const key = String(node.eventKey ?? node.key ?? '');
                if (!key.startsWith('box:')) return null;
                const boxId = parseBoxId(key);
                if (loadingBoxIds.includes(boxId)) {
                  return (
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}
                    >
                      <LoadingOutlined spin style={{ color: '#1677ff', fontSize: 12 }} />
                    </span>
                  );
                }
                return <DownOutlined />;
              }}
            />
          )}
        </div>
        <div style={{ color: 'rgba(0,0,0,0.65)' }}>
          已选择{checkedKeys.filter(key => key.startsWith('tool:')).length}个工具（您还可以选择
          {30 - checkedKeys.filter(key => key.startsWith('tool:')).length}个工具）
        </div>
      </Space>
    </Modal>
  );
};

export default AddToolsModal;
