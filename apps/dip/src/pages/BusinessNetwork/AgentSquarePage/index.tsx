import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MicroAppComponent from "@/components/MicroAppComponent";
import agentSquareBg from "@/assets/images/agent-square-gradient-bg.png";
import { BASE_PATH, getFullPath } from "@/utils/config";
import {
  buildBusinessNetworkPath,
  businessLeafMenuItems,
} from "@/components/Sider/BusinessSider/menus";
import {
  buildMicroAppInfo,
  normalizeMicroAppEntry,
} from "../build-micro-app-info";
import type { BusinessComponentPageProps } from "../page-registry";
import styles from "./agent-square-page.module.less";

type TabKey = "agent-list" | "agent-template" | "agent-api";

const AgentSquarePage = ({
  homeRoute,
  customProps,
}: BusinessComponentPageProps) => {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<TabKey>("agent-list");

  const tabToAppConfig = useMemo(
    () => ({
      "agent-list": {
        menuKey: "agentList",
        label: "决策智能体",
        // 为了避免子应用内部路由切换导致主应用不匹配而卸载，这里所有 Tab 统一使用 agent-square 的路由基准
        routePath: buildBusinessNetworkPath("/agent-square"),
        appName: "agent-list",
        entry: "//ip:port/agent-web/decision-agent.html",
      },
      "agent-template": {
        menuKey: "agentTemplate",
        label: "模板",
        routePath: buildBusinessNetworkPath("/agent-square"),
        appName: "agent-template",
        entry: "//ip:port/agent-web/agent-template.html",
      },
      "agent-api": {
        menuKey: "agentApi",
        label: "API",
        routePath: buildBusinessNetworkPath("/agent-square"),
        appName: "agent-api",
        entry: "//ip:port/agent-web/api.html",
      },
    }),
    [],
  );

  const appProps = useMemo(() => {
    const props = customProps as Record<string, unknown> & {
      history?: { navigateToMicroWidget?: (p: unknown) => void };
    };
    const originNavigateToMicroWidget = props?.history?.navigateToMicroWidget;

    return {
      ...props,
      history: {
        ...(props.history ?? {}),
        navigateToMicroWidget: (params: {
          name: string;
          path: string;
          isNewTab: boolean;
        }) => {
          const mappingFallback: Record<string, string> = {
            "agent-list": buildBusinessNetworkPath("/agent-list"),
            "agent-template": buildBusinessNetworkPath("/agent-template"),
            "agent-api": buildBusinessNetworkPath("/agent-api"),
          };

          const menuItem = businessLeafMenuItems.find(
            (item) =>
              item.page?.type === "micro-app" &&
              item.page?.app?.name === params.name,
          );

          const basePath = menuItem?.path ?? mappingFallback[params.name];
          if (basePath) {
            const targetPath = basePath + params.path;
            if (params.isNewTab) {
              const url = `${window.location.origin}${getFullPath(targetPath)}`;
              window.open(url, "_blank", "noopener,noreferrer");
            } else {
              navigate(targetPath.replace(BASE_PATH, ""));
            }
            return;
          }

          if (typeof originNavigateToMicroWidget === "function") {
            originNavigateToMicroWidget(params);
          }
        },
      },
    };
  }, [customProps, navigate]);

  const currentApp = tabToAppConfig[activeKey];
  const currentMicroAppInfo = useMemo(
    () =>
      buildMicroAppInfo(
        currentApp.menuKey,
        currentApp.label,
        currentApp.routePath,
        currentApp.appName,
        normalizeMicroAppEntry(currentApp.entry),
      ),
    [currentApp],
  );

  const tabsItems: TabsProps["items"] = useMemo(
    () => [
      {
        key: "agent-list",
        label: "决策智能体",
        children: (
          <MicroAppComponent
            appBasicInfo={currentMicroAppInfo}
            homeRoute={homeRoute}
            customProps={appProps}
          />
        ),
      },
      {
        key: "agent-template",
        label: "模板",
        children: (
          <MicroAppComponent
            appBasicInfo={currentMicroAppInfo}
            homeRoute={homeRoute}
            customProps={appProps}
          />
        ),
      },
      {
        key: "agent-api",
        label: "API",
        children: (
          <MicroAppComponent
            appBasicInfo={currentMicroAppInfo}
            homeRoute={homeRoute}
            customProps={appProps}
          />
        ),
      },
    ],
    [appProps, currentMicroAppInfo, homeRoute],
  );

  return (
    <div
      className="w-full h-full p-6 flex flex-col min-h-0"
      style={{
        backgroundImage: `url(${agentSquareBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as TabKey)}
        items={tabsItems}
        destroyInactiveTabPane
        className={styles.tabsFullHeight}
      />
    </div>
  );
};

export default AgentSquarePage;
