/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { PrimaryNavRail } from './components/PrimaryNavRail';
import { PrimaryNavTreeV3 } from './components/PrimaryNavTreeV3';
import { SecondarySideNav } from './components/SecondarySideNav';
import { DemoGuide } from './components/DemoGuide';
import { MarketPage } from './components/MarketPage';
import { PlatformHomePage } from './components/PlatformHomePage';
import { EmployeeManagePage } from './components/EmployeeManagePage';
import { KnowledgeBasePage } from './components/KnowledgeBasePage';
import { SkillPage } from './components/SkillPage';
import { ABTestingPage } from './components/ABTestingPage';
import { StaffManagePage } from './components/StaffManagePage';
import { RoleManagePage } from './components/RoleManagePage';
import { WorkspacePage } from './components/WorkspacePage';
import { QcWorkspacePage } from './components/QcWorkspacePage';
import { DomainOpsPage } from './components/DomainOpsPage';
import { CustomerExperiencePage } from './components/CustomerExperiencePage';
import { DashboardPage } from './components/DashboardPage';
import { SessionRecordsPage } from './components/SessionRecordsPage';
import { ResourcesPlaceholderPage } from './components/ResourcesPlaceholderPage';
import { NumberManagementView } from './modules/hotline/NumberManagementView';
import { AppToaster } from '@/components/ui/sonner';
import { TaskCenterHost } from './components/TaskCenterHost';
import { ToastPreviewPanel } from './components/common/ToastPreviewPanel';
import { NavIconCatalog } from './components/NavIconCatalog';
import { VersionSwitcher } from './components/VersionSwitcher';
import { ComponentLibraryPage } from './components/ComponentLibraryPage';
import { LoginPage } from './components/LoginPage';
import {
  readNavLayoutVersion,
  type NavLayoutVersion,
} from '@/lib/navLayoutVersion';
import { getInviteTokenFromLocation } from '@/lib/inviteRoute';
import { InviteJoinPage } from './components/invite/InviteJoinPage';
import {
  AUTH_LOGOUT_EVENT,
  clearAuthSession,
  consumeLoginRedirectView,
  isAuthenticated,
  readAuthSession,
  setAuthenticatedSession,
  setLoginRedirectView,
} from '@/lib/authSession';
import {
  clearTenantSession,
  getTenantsForPhone,
  hasSelectedTenant,
  setSelectedTenant,
} from '@/lib/tenantSession';
import { cn } from '@/lib/utils';

const DESIGN_SYSTEM_PATHS = ['/design-system', '/component-library', '/ds'] as const;

const isDesignSystemRoute = () => {
  const ds = new URLSearchParams(window.location.search).get('ds');
  if (ds === '1' || ds === 'ai') return true;
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return DESIGN_SYSTEM_PATHS.some((p) => path === p || path.endsWith(p));
};

const shouldSkipLogin = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('skipLogin') === '1' || isDesignSystemRoute();
};

/** 友好路径归一化到 /?ds=1 或保留 /?ds=ai，便于收藏与分享 */
const useDesignSystemUrlNormalize = () => {
  useEffect(() => {
    if (!isDesignSystemRoute()) return;
    const params = new URLSearchParams(window.location.search);
    const ds = params.get('ds');
    if (ds === '1' || ds === 'ai') return;

    const { pathname, search, hash } = window.location;
    const path = pathname.replace(/\/+$/, '') || '/';
    const onFriendlyPath = DESIGN_SYSTEM_PATHS.some(
      (p) => path === p || path.endsWith(p),
    );
    const next = new URLSearchParams(search);
    next.set('ds', '1');
    const qs = next.toString();
    const nextPath = onFriendlyPath ? '/' : pathname;
    window.history.replaceState(null, '', `${nextPath}?${qs}${hash}`);
  }, []);
};

const AppContent: React.FC<{ navLayout: NavLayoutVersion }> = ({ navLayout }) => {
  const {
    activeTab,
    activeOnboardingAgentId,
    setActiveOnboardingAgentId,
    hiredAgents,
  } = useApp();
  const isDualSide = navLayout === 'dualSide';
  const isTreeNav = navLayout === 'collapsibleTree';
  const onDesignSystem = isDesignSystemRoute();

  useDesignSystemUrlNormalize();

  useEffect(() => {
    if (activeOnboardingAgentId && !hiredAgents.some((a) => a.id === activeOnboardingAgentId)) {
      setActiveOnboardingAgentId(null);
    }
  }, [activeOnboardingAgentId, hiredAgents, setActiveOnboardingAgentId]);

  if (onDesignSystem) {
    return <ComponentLibraryPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'platformHome':
        return <PlatformHomePage />;
      case 'market':
        return <MarketPage />;
      case 'employees':
      case 'training':
        return <EmployeeManagePage />;
      case 'kb':
        return <KnowledgeBasePage />;
      case 'skills':
        return <SkillPage />;
      case 'abTest':
        return <ABTestingPage />;
      case 'staff':
        return <StaffManagePage />;
      case 'roles':
        return <RoleManagePage />;
      case 'workspace':
        return <WorkspacePage />;
      case 'qcWorkspace':
        return <QcWorkspacePage />;
      case 'outboundApp':
      case 'hotlineApp':
      case 'collectionApp':
      case 'telesalesApp':
      case 'followupApp':
        return <DomainOpsPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'sessions':
        return <SessionRecordsPage />;
      case 'caseLibrary':
        return <SessionRecordsPage caseLibraryOnly />;
      case 'phoneLines':
        return (
          <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-white text-neutral-800 font-sans text-xs antialiased">
            <NumberManagementView />
          </div>
        );
      case 'smsResources':
        return (
          <ResourcesPlaceholderPage
            title="短信资源"
            description="短信资源本期不实现。"
            prdHint="暂无，后续版本再开放。"
          />
        );
      default:
        return <MarketPage />;
    }
  };

  if (activeTab === 'workspace') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-white font-sans antialiased text-neutral-800">
        <WorkspacePage />
      </div>
    );
  }

  if (activeTab === 'customerExperience') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-neutral-100 font-sans antialiased text-neutral-800">
        <CustomerExperiencePage />
      </div>
    );
  }

  if (activeOnboardingAgentId) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-white font-sans antialiased text-neutral-800">
        <EmployeeManagePage />
        <DemoGuide />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 font-sans antialiased text-neutral-800">
      {isTreeNav ? (
        <PrimaryNavTreeV3 />
      ) : (
        <PrimaryNavRail showRightBorder={isDualSide} overflowToMore={false} />
      )}
      {isDualSide ? <SecondarySideNav /> : null}
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden relative bg-neutral-50 min-w-0">
        {isDualSide || isTreeNav ? null : (
          <div className="shrink-0 bg-neutral-50">
            <Navigation />
          </div>
        )}
        <div
          className={cn(
            'flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col bg-white',
            isTreeNav ? 'rounded-none' : 'rounded-tl-2xl',
          )}
        >
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col">
            {renderActivePage()}
          </div>
        </div>
        <DemoGuide />
      </div>
    </div>
  );
};

const VersionSwitcherGate: React.FC<{
  version: NavLayoutVersion;
  onChange: (v: NavLayoutVersion) => void;
  screen: 'login' | 'home';
  onGoLogin: () => void;
  onGoHome: () => void;
}> = (props) => {
  const { activeTab } = useApp();
  if (activeTab === 'customerExperience') return null;
  return <VersionSwitcher {...props} />;
};

const ToastPreviewHost: React.FC = () => {
  const { showToast } = useApp();
  const toastPreview = new URLSearchParams(window.location.search).get('toastPreview') === '1';
  if (!toastPreview) return null;
  return <ToastPreviewPanel showToast={showToast} />;
};

const NavIconCatalogHost: React.FC = () => {
  const [open, setOpen] = useState(() => window.location.hash === '#nav-icons');

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === '#nav-icons');
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  if (!open) return null;
  return (
    <NavIconCatalog
      onClose={() => {
        const { pathname, search } = window.location;
        window.history.replaceState(null, '', `${pathname}${search}`);
        setOpen(false);
      }}
    />
  );
};

export default function App() {
  const inviteToken = getInviteTokenFromLocation();
  const [navLayout, setNavLayout] = useState<NavLayoutVersion>(() =>
    readNavLayoutVersion(),
  );
  const hideVersionSwitcher = isDesignSystemRoute() || Boolean(inviteToken);
  const [authenticated, setAuthenticated] = useState(
    () => shouldSkipLogin() || isAuthenticated(),
  );
  const [tenantReady, setTenantReady] = useState(() => {
    if (shouldSkipLogin()) return true;
    if (!isAuthenticated()) return false;
    // 演示：只要未主动选过租户，就进入租户选择（不因单租户自动跳过）
    return hasSelectedTenant();
  });
  const [loginInitialView, setLoginInitialView] = useState<'login' | 'enterprise'>(() => {
    return consumeLoginRedirectView() === 'enterprise' ? 'enterprise' : 'login';
  });

  /** 企业认证完成后进入租户选择（演示全链路，不自动跳过） */
  const finishLogin = (phone: string) => {
    setAuthenticatedSession(phone);
    setAuthenticated(true);
    clearTenantSession();
    setTenantReady(false);
  };

  const goToLogin = () => {
    clearTenantSession();
    clearAuthSession();
    setAuthenticated(false);
    setTenantReady(false);
    setLoginInitialView('login');
  };

  const goToHome = () => {
    const phone = '13800000002';
    setAuthenticatedSession(phone);
    setAuthenticated(true);
    const tenants = getTenantsForPhone(phone);
    setSelectedTenant(tenants[0]?.id ?? 'T2026080901');
    setTenantReady(true);
  };

  const appScreen: 'login' | 'home' = authenticated && tenantReady ? 'home' : 'login';

  const versionSwitcherProps = {
    version: navLayout,
    onChange: setNavLayout,
    screen: appScreen,
    onGoLogin: goToLogin,
    onGoHome: goToHome,
  } as const;

  const versionSwitcher = hideVersionSwitcher ? null : (
    <VersionSwitcher {...versionSwitcherProps} />
  );

  useEffect(() => {
    const onLogout = () => {
      setAuthenticated(false);
      setTenantReady(false);
      setLoginInitialView('login');
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  if (inviteToken && !isDesignSystemRoute()) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <InviteJoinPage token={inviteToken} />
        <AppToaster duration={1600} visibleToasts={1} expand={false} />
      </ThemeProvider>
    );
  }

  if (!authenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <LoginPage
          initialView={loginInitialView}
          onSuccess={finishLogin}
        />
        {versionSwitcher}
        <AppToaster duration={1600} visibleToasts={1} expand={false} />
      </ThemeProvider>
    );
  }

  if (!tenantReady) {
    const phone = readAuthSession()?.phone ?? '';
    const tenants = getTenantsForPhone(phone);
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <LoginPage
          onSuccess={() => {}}
          tenantSelect={{
            tenants,
            onSelect: (tenantId) => {
              setSelectedTenant(tenantId);
              setTenantReady(true);
            },
            onCreateTenant: () => {
              const phone = readAuthSession()?.phone ?? '';
              if (phone) {
                sessionStorage.setItem('js_pending_enterprise_phone', phone);
              }
              clearTenantSession();
              setLoginRedirectView('enterprise');
              setAuthenticated(false);
              setTenantReady(false);
              setLoginInitialView('enterprise');
            },
            onSwitchAccount: () => {
              clearTenantSession();
              clearAuthSession();
              setAuthenticated(false);
              setTenantReady(false);
              setLoginInitialView('login');
            },
          }}
        />
        {versionSwitcher}
        <AppToaster duration={1600} visibleToasts={1} expand={false} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppProvider>
        <AppContent navLayout={navLayout} />
        <TaskCenterHost />
        <ToastPreviewHost />
        <NavIconCatalogHost />
        {hideVersionSwitcher ? null : <VersionSwitcherGate {...versionSwitcherProps} />}
        <AppToaster duration={1600} visibleToasts={1} expand={false} />
      </AppProvider>
    </ThemeProvider>
  );
}
