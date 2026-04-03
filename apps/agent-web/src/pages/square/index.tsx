import { Tabs } from 'antd';
import { lazy, useMemo, useState } from 'react';
import { ModeEnum } from '@/components/DecisionAgent/types';
import { createRouteApp } from '@/utils/qiankun-entry-generator';

const routeComponents = {
  DecisionAgent: lazy(() => import('@/components/DecisionAgent')),
  AgentConfig: lazy(() => import('@/components/AgentConfig')),
  AgentUsage: lazy(() => import('../my-agents/AgentUsage')),
  AgentDetail: lazy(() => import('@/components/AgentDetail')),
  DolphinLanguageDoc: lazy(() => import('../decision-agent/DolphinLanguageDoc')),
  AgentApiDocument: lazy(() => import('../decision-agent/AgentApiDocument')),
};

const SquareHome = () => {
  const [activeMode, setActiveMode] = useState<ModeEnum>(ModeEnum.DataAgent);

  const items = useMemo(
    () => [
      { key: ModeEnum.DataAgent, label: '决策智能体' },
      { key: ModeEnum.AllTemplate, label: '模板' },
      { key: ModeEnum.API, label: 'API' },
    ],
    []
  );

  return (
    <div className="dip-flex-column dip-h-100">
      <div className="dip-pl-16">
        <Tabs activeKey={activeMode} items={items} onChange={key => setActiveMode(key as ModeEnum)} />
      </div>
      <div className="dip-overflow-hidden">
        {activeMode === ModeEnum.DataAgent && <routeComponents.DecisionAgent mode={activeMode} />}

        {activeMode === ModeEnum.AllTemplate && <routeComponents.DecisionAgent mode={activeMode} />}

        {activeMode === ModeEnum.API && <routeComponents.DecisionAgent mode={activeMode} />}
      </div>
    </div>
  );
};

const routes = [
  {
    path: '/',
    element: <SquareHome />,
  },
  {
    path: '/config',
    element: <routeComponents.AgentConfig />,
  },
  {
    path: '/usage',
    element: <routeComponents.AgentUsage />,
  },
  {
    path: '/dolphin-language-doc',
    element: <routeComponents.DolphinLanguageDoc />,
  },
  {
    path: '/detail/:id',
    element: <routeComponents.AgentDetail />,
  },
  {
    path: '/template-detail/:id',
    element: <routeComponents.AgentDetail isTemplate={true} onlyShowPublishedVersion={true} />,
  },
  {
    path: '/api-doc',
    element: <routeComponents.AgentApiDocument />,
  },
];

const { bootstrap, mount, unmount } = createRouteApp(routes);
export { bootstrap, mount, unmount };
