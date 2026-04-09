import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { BusinessComponentPageProps } from '../page-registry';

const OperatorListPage = lazy(() => import('./pages/OperatorListPage'));
const OperatorDetailPage = lazy(() => import('./pages/OperatorDetailPage'));
const ToolDetailPage = lazy(() => import('./pages/ToolDetailPage'));
const McpDetailPage = lazy(() => import('./pages/McpDetailPage'));
const OperatorDetailFlowPage = lazy(() => import('./pages/OperatorDetailFlowPage'));
const IDEWorkspacePage = lazy(() => import('./pages/IDEWorkspacePage'));

const ExecutionManagement = ({ customProps }: Pick<BusinessComponentPageProps, 'customProps'>) => {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full flex items-center justify-center">
          <Spin />
        </div>
      }
    >
      <Routes>
        <Route index element={<OperatorListPage customProps={customProps} />} />
        <Route path="operator-detail" element={<OperatorDetailPage />} />
        <Route path="tool-detail" element={<ToolDetailPage />} />
        <Route path="mcp-detail" element={<McpDetailPage />} />
        <Route path="details/:id" element={<OperatorDetailFlowPage />} />
        <Route path="details/:id/log/:recordId" element={<OperatorDetailFlowPage />} />
        <Route path="ide/toolbox/:toolboxId/tool/create" element={<IDEWorkspacePage />} />
        <Route path="ide/toolbox/:toolboxId/tool/:toolId/edit" element={<IDEWorkspacePage />} />
        <Route path="ide/operator/create" element={<IDEWorkspacePage />} />
        <Route path="ide/operator/:operatorId/edit" element={<IDEWorkspacePage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ExecutionManagement;
