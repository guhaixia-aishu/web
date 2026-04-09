import { del, get, post } from '@/utils/http';

const apis = {
  operatorList: '/api/agent-operator-integration/v1/operator/info/list',
  operatorInfo: '/api/agent-operator-integration/v1/operator/info',
  operatorMarketList: '/api/agent-operator-integration/v1/operator/market',
  operatorDebug: '/api/agent-operator-integration/v1/operator/debug',
  operatorRegiste: '/api/agent-operator-integration/v1/operator/register',
  operatorStatus: '/api/agent-operator-integration/v1/operator/status',
  operatorDel: '/api/agent-operator-integration/v1/operator/delete',
  operatorCategory: '/api/agent-operator-integration/v1/operator/category',
  mcpList: '/api/agent-operator-integration/v1/mcp/list',
  mcpSSE: '/api/agent-operator-integration/v1/mcp/parse/sse',
  mcpMarket: '/api/agent-operator-integration/v1/mcp/market',
  mcpProxy: '/api/agent-operator-integration/v1/mcp/proxy',
  toolBoxList: '/api/agent-operator-integration/v1/tool-box/list',
  mcp: '/api/agent-operator-integration/v1/mcp',
  toolBox: '/api/agent-operator-integration/v1/tool-box',
  impexImport: '/api/agent-operator-integration/v1/impex/import',
};

export interface OperatorListQuery {
  page: number;
  page_size: number;
  name?: string;
  status?: string;
  category?: string;
}

export function getOperatorList(params: OperatorListQuery) {
  return get(apis.operatorList, { params }) as Promise<{ data: any[]; total: number }>;
}

export function getToolBoxList(params: OperatorListQuery) {
  return get(apis.toolBoxList, { params }) as Promise<{ data: any[]; total: number }>;
}

export function getToolBoxMarketList(params: { page: number; status: string; all: boolean }) {
  return get('/api/agent-operator-integration/v1/tool-box/market', { params }) as Promise<{
    data: any[];
    total: number;
  }>;
}

export function getGlobalMarketToolList(params: {
  sort_by: string;
  sort_order: string;
  tool_name: string;
  status: string;
  all: boolean;
}) {
  return get('/api/agent-operator-integration/v1/tool-box/market/tools', { params }) as Promise<{
    data: any[];
    total: number;
  }>;
}

export function getToolBox(params: { box_id: string }) {
  return get(`${apis.toolBox}/${params.box_id}`) as Promise<any>;
}

export function getToolBoxMarket(params: { box_id: string }) {
  return get(`/api/agent-operator-integration/v1/tool-box/market/${params.box_id}`) as Promise<any>;
}

export function getMCPList(params: OperatorListQuery) {
  return get(apis.mcpList, { params }) as Promise<{ data: any[]; total: number }>;
}

export function getMCP(params: { mcp_id: string }) {
  return get(`${apis.mcp}/${params.mcp_id}`, { params }) as Promise<any>;
}

export function getMCPMarket(params: { mcp_id: string }) {
  return get(`${apis.mcpMarket}/${params.mcp_id}`, { params }) as Promise<any>;
}

export function getMcpTools(mcpId: string) {
  return get(`${apis.mcpProxy}/${mcpId}/tools`) as Promise<{ tools: any[] }>;
}

export function debugMcp(mcpId: string, toolName: string, data: Record<string, unknown>) {
  const safe = encodeURIComponent(toolName);
  return post(`${apis.mcp}/${mcpId}/tool/${safe}/debug`, {
    body: data,
    timeout: 5 * 60 * 1000,
  }) as Promise<any>;
}

export function mcpSSE(data: { url: string; mode: string; headers?: Record<string, string> }) {
  return post(apis.mcpSSE, { body: data }) as Promise<{ tools: any[] }>;
}

export function getOperatorCategory() {
  return get(apis.operatorCategory) as Promise<Array<{ category_type: string; name: string }>>;
}

export function getOperatorInfo(params: { operator_id: string }) {
  return get(`${apis.operatorInfo}/${params.operator_id}`, { params }) as Promise<any>;
}

export function getOperatorMarketInfo(params: { operator_id: string }) {
  return get(`${apis.operatorMarketList}/${params.operator_id}`, { params }) as Promise<any>;
}

export function operatorDebug(data: Record<string, unknown>) {
  return post(apis.operatorDebug, { body: data, timeout: 5 * 60 * 1000 }) as Promise<any>;
}

export function getToolList(params: {
  box_id: string;
  page: number;
  page_size: number;
  status?: string;
  all?: boolean;
}) {
  return get(`${apis.toolBox}/${params.box_id}/tools/list`, { params }) as Promise<{ tools: any[]; total: number }>;
}

export function getToolDetail(boxId: string, toolId: string) {
  return get(`${apis.toolBox}/${boxId}/tool/${toolId}`) as Promise<any>;
}

export function debugTool(boxId: string, toolId: string, data: Record<string, unknown>) {
  return post(`${apis.toolBox}/${boxId}/tool/${toolId}/debug`, {
    body: data,
    timeout: 5 * 60 * 1000,
  }) as Promise<any>;
}

export function postMCP(data: Record<string, unknown>) {
  return post(apis.mcp, { body: data });
}

export function putMCP(mcpId: string, data: Record<string, unknown>) {
  return post(`${apis.mcp}/${mcpId}`, { body: data });
}

export function postToolBox(data: FormData | Record<string, unknown>) {
  return post(apis.toolBox, { body: data });
}

export function impexImport(data: FormData, type: 'operator' | 'toolbox') {
  return post(`${apis.impexImport}/${type}`, { body: data });
}

export function postOperatorRegiste(data: FormData) {
  return post(apis.operatorRegiste, { body: data }) as Promise<any[]>;
}

export function postOperatorStatus(data: Array<{ operator_id: string; status: string }>) {
  return post(apis.operatorStatus, { body: data });
}

export function delOperator(data: Array<{ operator_id: string; version?: string }>) {
  return del(apis.operatorDel, { body: data });
}

export function boxToolStatus(boxId: string, data: { status: string }) {
  return post(`${apis.toolBox}/${boxId}/status`, { body: data });
}

export function delToolBox(data: { box_id: string }) {
  return del(`${apis.toolBox}/${data.box_id}`, { body: data });
}

export function mapReleaseAction(mcpId: string, data: { status: string }) {
  return post(`${apis.mcp}/${mcpId}/status`, { body: data });
}

export function delMCP(data: { mcp_id: string }) {
  return del(`${apis.mcp}/${data.mcp_id}`, { body: data });
}
