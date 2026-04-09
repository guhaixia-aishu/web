import { ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Select, Space, Spin, Tabs, message } from 'antd';
import type { SelectProps, TabsProps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import OperatorEmptyIcon from '@/assets/images/abnormal/operator-empty.svg?react';
import { getMCPList, getOperatorCategory, getOperatorList, getToolBoxList, postResourceTypeOperation } from '@/apis';
import OperatorCardList from '../components/OperatorCardList';
import CreateAndImportBar from '../components/CreateAndImportBar';
import { openPermConfig, transformArray } from '../utils/permConfig';

enum OperatorTypeEnum {
  MCP = 'mcp',
  Operator = 'operator',
  ToolBox = 'tool_box',
}

enum OperatorStatusType {
  Offline = 'offline',
  Published = 'published',
  Unpublish = 'unpublish',
  Editing = 'editing',
}

enum PermConfigTypeEnum {
  Authorize = 'authorize',
}

export type OperatorItem = {
  id?: string;
  name?: string;
  description?: string;
  box_name?: string;
  box_desc?: string;
  metadata?: { description?: string };
  status?: string;
  category?: string;
  update_time?: string;
};

interface OperatorListPageProps {
  customProps?: Record<string, unknown>;
}

const OperatorListPage = ({ customProps }: OperatorListPageProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('activeTab') || OperatorTypeEnum.MCP);
  const [publishStatus, setPublishStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<OperatorItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [categoryType, setCategoryType] = useState<Array<{ category_type: string; name: string }>>([]);
  const [permConfigInfo, setPermConfigInfo] = useState<Record<string, string[]>>({});
  const pageSize = 20;

  const tabItems: TabsProps['items'] = [
    { key: OperatorTypeEnum.MCP, label: 'MCP' },
    { key: OperatorTypeEnum.ToolBox, label: '工具' },
    { key: OperatorTypeEnum.Operator, label: '算子' },
  ];

  const statusOptions: SelectProps['options'] = useMemo(
    () =>
      [
        { value: '', label: '全部' },
        { value: OperatorStatusType.Published, label: '已发布' },
        { value: OperatorStatusType.Unpublish, label: '未发布' },
        { value: OperatorStatusType.Offline, label: '已下架' },
        { value: OperatorStatusType.Editing, label: '已发布编辑中' },
      ].filter(option => !(activeTab === OperatorTypeEnum.ToolBox && option.value === OperatorStatusType.Editing)),
    [activeTab]
  );

  const loadCategory = useCallback(async () => {
    try {
      const data = await getOperatorCategory();
      setCategoryType([{ category_type: '', name: '全部' }, ...(data || [])]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const operationCheck = useCallback(async () => {
    try {
      const data = await postResourceTypeOperation({
        method: 'GET',
        resource_types: [OperatorTypeEnum.ToolBox, OperatorTypeEnum.MCP, OperatorTypeEnum.Operator],
      });
      setPermConfigInfo(transformArray(data || []));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchInfo = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const query = {
          page,
          page_size: pageSize,
          name: searchText,
          status: publishStatus,
          category,
        };

        let response: { data: OperatorItem[]; total: number } = { data: [], total: 0 };
        if (activeTab === OperatorTypeEnum.Operator) {
          const raw = await getOperatorList(query);
          response = {
            total: raw.total || 0,
            data: (raw.data || []).map(item => ({
              ...item,
              description: item.metadata?.description,
            })),
          };
        } else if (activeTab === OperatorTypeEnum.ToolBox) {
          const raw = await getToolBoxList(query);
          response = {
            total: raw.total || 0,
            data: (raw.data || []).map(item => ({
              ...item,
              name: item.box_name,
              metadata: { description: item.box_desc },
            })),
          };
        } else {
          response = await getMCPList(query);
        }

        const nextData = response.data || [];
        const nextTotal = response.total || 0;
        if (page === 1) {
          setItems(nextData);
          setHasMore(nextData.length < nextTotal);
          return;
        }
        setItems(prev => {
          const merged = [...prev, ...nextData];
          setHasMore(merged.length < nextTotal);
          return merged;
        });
      } catch (error: any) {
        message.error(error?.description || '获取列表失败');
      } finally {
        setLoading(false);
      }
    },
    [activeTab, publishStatus, category, searchText]
  );

  useEffect(() => {
    loadCategory();
    operationCheck();
  }, [loadCategory, operationCheck]);

  useEffect(() => {
    setCurrentPage(1);
    setItems([]);
    fetchInfo(1);
  }, [fetchInfo]);

  const onTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('activeTab', key);
      return next;
    });
  };

  const onLoadMore = () => {
    if (!hasMore || loading) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    fetchInfo(next);
  };

  const handlePermConfigClick = async () => {
    try {
      await openPermConfig({ id: '*', name: '', type: activeTab || OperatorTypeEnum.MCP }, customProps);
    } catch (error: any) {
      message.error(error?.message || '权限配置组件加载失败');
    }
  };

  return (
    <div className="h-full w-full p-6 flex flex-col">
      <div className="flex items-center justify-between">
        <Tabs activeKey={activeTab} onChange={onTabChange} items={tabItems} />
        <Space>
          <CreateAndImportBar activeTab={activeTab} onRefresh={() => fetchInfo(1)} />
          {permConfigInfo?.[activeTab || OperatorTypeEnum.MCP]?.includes(PermConfigTypeEnum.Authorize) ? (
            <Button icon={<IconFont type="icon-permissions" />} onClick={handlePermConfigClick}>
              权限配置
            </Button>
          ) : null}
        </Space>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Space size={16} wrap>
          <Space>
            <span>类型：</span>
            <Select value={category} onChange={setCategory} style={{ width: 160 }}>
              {categoryType.map(item => (
                <Select.Option key={item.category_type} value={item.category_type}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </Space>
          <Space>
            <span>发布状态：</span>
            <Select value={publishStatus} onChange={setPublishStatus} style={{ width: 160 }} options={statusOptions} />
          </Space>
        </Space>
        <Space>
          <SearchInput placeholder="搜索名称" onSearch={setSearchText} />
          <Button icon={<ReloadOutlined />} onClick={() => fetchInfo(1)} />
        </Space>
      </div>

      {!loading && items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Empty
            image={<OperatorEmptyIcon style={{ fontSize: 150 }} />}
            styles={{ image: { width: 150, height: 150 } }}
            description="暂无数据"
          />
        </div>
      ) : (
        <Spin spinning={loading} className="flex-1">
          {items.length > 0 && (
            <>
              <OperatorCardList activeTab={activeTab} items={items} onRefresh={() => fetchInfo(1)} />
              <div className="flex justify-center mt-4">
                <Button onClick={onLoadMore} disabled={!hasMore || loading}>
                  {hasMore ? '加载更多' : '没有更多了'}
                </Button>
              </div>
            </>
          )}
        </Spin>
      )}
    </div>
  );
};

export default OperatorListPage;
