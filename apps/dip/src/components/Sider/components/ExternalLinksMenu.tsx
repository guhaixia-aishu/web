import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { useMemo } from 'react';
import SidebarAiStoreIcon from '@/assets/images/sider/aiStore.svg?react';
import SidebarSystemIcon from '@/assets/images/sider/proton.svg?react';
import { BUSINESS_NETWORK_BASE_PATH } from '@/components/Sider/BusinessSider/menus';
import { getFirstVisibleRouteBySiderType } from '@/routes/utils';
import { getFullPath } from '@/utils/config';
import IconFont from '../../IconFont';

export interface ExternalLinksMenuProps {
  /** 是否折叠侧栏 */
  collapsed: boolean;
  /** 可见路由角色（与主菜单一致） */
  roleIds?: Set<string>;
}

/**
 * 侧栏底部外链：AI Store、业务知识网络 SSO、系统工作台
 */
export const ExternalLinksMenu = ({ collapsed, roleIds }: ExternalLinksMenuProps) => {
  const items = useMemo<MenuProps['items']>(() => {
    const firstStoreRoute = getFirstVisibleRouteBySiderType('store', roleIds || new Set());
    const baseOrigin = window.location.origin;
    const getExternalUrl = (path: string) => `${baseOrigin}${path}`;

    const storePath = `/${firstStoreRoute?.path || 'store/my-app'}`;
    const storeHref = getFullPath(storePath);
    const businessNetworkHref = getFullPath(BUSINESS_NETWORK_BASE_PATH);

    return [
      {
        key: 'ai-store',
        title: 'AI Store',
        label: (
          <a
            href={storeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 justify-between"
          >
            <span>AI Store</span> <IconFont type="icon-right" />
          </a>
        ),
        icon: <SidebarAiStoreIcon />,
      },
      {
        key: 'data-platform',
        title: '全局业务知识网络',
        label: (
          <a
            href={businessNetworkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 justify-between"
          >
            <span>全局业务知识网络</span>
            <IconFont type="icon-arrowup" rotate={45} />
          </a>
        ),
        icon: <IconFont type="icon-graph" />,
      },
      {
        key: 'system',
        title: '系统工作台',
        label: (
          <a
            href={getExternalUrl('/deploy')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 justify-between"
          >
            <span>系统工作台</span>
            <IconFont type="icon-arrowup" rotate={45} />
          </a>
        ),
        icon: <SidebarSystemIcon />,
      },
    ];
  }, [roleIds]);

  return (
    <div className="shrink-0">
      <Menu mode="inline" selectedKeys={[]} items={items} inlineCollapsed={collapsed} selectable={false} />
    </div>
  );
};
