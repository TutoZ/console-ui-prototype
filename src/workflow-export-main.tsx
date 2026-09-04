/**
 * 工作流画布独立导出入口（单文件 HTML 预览）
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { AppToaster } from '@/components/ui/sonner';
import { WorkflowCanvasPage } from './components/workflow/WorkflowCanvasPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <div className="fixed inset-0 bg-white">
        <WorkflowCanvasPage
          agentName="工作流预览员工"
          agentId="workflow_export_demo"
          onBack={() => {
            window.alert('这是工作流独立预览页，关闭浏览器标签即可退出。');
          }}
        />
      </div>
      <AppToaster duration={1600} visibleToasts={1} expand={false} />
    </AppProvider>
  </StrictMode>,
);
