import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { CurrentMicroAppInfo } from "@/stores/microAppStore";

export interface BusinessComponentPageProps {
  appBasicInfo: CurrentMicroAppInfo | null;
  homeRoute: string;
  customProps: Record<string, unknown>;
}

export const businessComponentPageRegistry: Record<
  string,
  | ComponentType<BusinessComponentPageProps>
  | LazyExoticComponent<ComponentType<BusinessComponentPageProps>>
> = {
  "agent-square": lazy(() => import("./AgentSquarePage")),
};
