import { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/useAuth';
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import TopHeader from './components/layout/TopHeader';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import CreateProjectModal from './components/dashboard/CreateProjectModal';
import SettingsModal from './components/settings/SettingsModal';
import { getProjectsApi, clearApiCaches } from './services/api';
import type { ProjectData } from './services/api';

function getUserInitials(user: { displayName?: string | null; email?: string | null } | null): string {
  if (!user) return 'A';
  if (user.displayName && user.displayName.trim()) {
    const parts = user.displayName.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.displayName.slice(0, 1).toUpperCase();
  }
  if (user.email) {
    return user.email.slice(0, 1).toUpperCase();
  }
  return 'A';
}

function AuthenticatedApp() {
  const { user, loading, getIdToken, signOutUser } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace'>('dashboard');
  const [selectedProjectName, setSelectedProjectName] = useState('Project Workspace');

  // Real user projects from Firestore
  const [userProjects, setUserProjects] = useState<ProjectData[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Initial load when user signs in
  useEffect(() => {
    let ignore = false;
    if (!user) {
      return;
    }

    getIdToken().then((token) => {
      if (!token || ignore) return;
      setIsLoadingProjects(true);
      setProjectsError(null);
      getProjectsApi(token)
        .then((res) => {
          if (ignore) return;
          const projects = res.projects || [];
          setUserProjects(projects);

          // Restore active project from sessionStorage if present
          const savedProjectId = sessionStorage.getItem('handoverx_active_project_id');
          const savedView = sessionStorage.getItem('handoverx_active_view');

          if (savedProjectId) {
            const found = projects.find((p) => p.projectId === savedProjectId);
            if (found) {
              setCurrentProject(found);
              setSelectedProjectName(found.name);
              if (savedView === 'workspace') {
                setCurrentView('workspace');
                setActiveTab('my-projects');
              }
            }
          }
        })
        .catch((err) => {
          if (!ignore) {
            const errorMsg =
              err instanceof Error
                ? err.message
                : 'Unable to connect to the HandoverX backend server. Please verify the server is running.';
            setProjectsError(errorMsg);
            console.error('Failed to load user projects:', err);
          }
        })
        .finally(() => {
          if (!ignore) {
            setIsLoadingProjects(false);
          }
        });
    });

    return () => {
      ignore = true;
    };
  }, [user, getIdToken]);

  const handleRetryProjects = useCallback(async () => {
    if (!user) return;
    setIsLoadingProjects(true);
    setProjectsError(null);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await getProjectsApi(token, true);
      setUserProjects(res.projects || []);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Unable to connect to the HandoverX backend server. Please verify the server is running.';
      setProjectsError(errorMsg);
      console.error('Failed to retry user projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user, getIdToken]);

  // If Firebase auth state is still resolving
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F7F5F0] flex flex-col items-center justify-center font-barlow antialiased text-[#252923]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-gradient-to-r from-[#263B32] via-[#34443B] to-[#C66A3D] flex items-center justify-center font-bold text-[13px] animate-pulse shadow-sm">
            <span className="text-[#FFFFFF]">HX</span>
          </div>
          <span className="text-[12px] font-medium text-[#77766F]">
            Initializing HandoverX workspace...
          </span>
        </div>
      </div>
    );
  }

  // Protected Route Guard: Unauthenticated users are redirected to Sign In / Sign Up
  if (!user) {
    return <AuthPage />;
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard' || tabId === 'recent-activity') {
      setCurrentView('dashboard');
      sessionStorage.setItem('handoverx_active_view', 'dashboard');
    } else if (tabId === 'my-projects') {
      if (currentProject || userProjects.length > 0) {
        if (!currentProject && userProjects.length > 0) {
          const first = userProjects[0];
          setCurrentProject(first);
          setSelectedProjectName(first.name);
          sessionStorage.setItem('handoverx_active_project_id', first.projectId);
        }
        setCurrentView('workspace');
        sessionStorage.setItem('handoverx_active_view', 'workspace');
      } else {
        setIsCreateModalOpen(true);
      }
    } else if (tabId === 'settings') {
      setIsSettingsModalOpen(true);
    }
  };

  const handleSelectProject = (projectId: string, projectTitle: string, projectDesc?: string) => {
    const found = userProjects.find((p) => p.projectId === projectId);
    const proj: ProjectData = found || {
      projectId,
      name: projectTitle,
      description: projectDesc || '',
      ownerId: user.uid,
    };

    setCurrentProject(proj);
    setSelectedProjectName(proj.name);
    setCurrentView('workspace');
    setActiveTab('my-projects');
    sessionStorage.setItem('handoverx_active_project_id', projectId);
    sessionStorage.setItem('handoverx_active_view', 'workspace');
  };

  const handleProjectCreated = (newProject: ProjectData) => {
    setUserProjects((prev) => [newProject, ...prev]);
    setCurrentProject(newProject);
    setSelectedProjectName(newProject.name);
    setCurrentView('workspace');
    setActiveTab('my-projects');
    sessionStorage.setItem('handoverx_active_project_id', newProject.projectId);
    sessionStorage.setItem('handoverx_active_view', 'workspace');
  };

  const handleNavigateDashboard = () => {
    setCurrentView('dashboard');
    setActiveTab('dashboard');
    sessionStorage.setItem('handoverx_active_view', 'dashboard');
  };

  const handleNavigateMyProjects = () => {
    if (userProjects.length > 0) {
      if (!currentProject) {
        const first = userProjects[0];
        setCurrentProject(first);
        setSelectedProjectName(first.name);
        sessionStorage.setItem('handoverx_active_project_id', first.projectId);
      }
      setCurrentView('workspace');
      setActiveTab('my-projects');
      sessionStorage.setItem('handoverx_active_view', 'workspace');
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    clearApiCaches();
    setUserProjects([]);
    setCurrentProject(null);
    sessionStorage.removeItem('handoverx_active_project_id');
    sessionStorage.removeItem('handoverx_active_view');
    await signOutUser();
  };

  const displayName =
    user.displayName || (user.email ? user.email.split('@')[0] : 'Workspace Admin');
  const userPlan = user.email || 'Enterprise Plan';
  const userInitials = getUserInitials(user);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#252923] font-barlow antialiased relative selection:bg-[#263B32]/15 selection:text-[#252923] overflow-x-hidden">
      {/* Subtle Warm Obsidian Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 atmospheric-background" aria-hidden="true">
        {/* Soft Sand Ambient Glow */}
        <div
          className="atmospheric-glow-left absolute -left-[160px] top-[10%] w-[580px] h-[680px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(231, 225, 215, 0.75) 0%, rgba(247, 245, 240, 0) 70%)' }}
        />
        {/* Subtle Warm Terracotta Accent Glow */}
        <div
          className="atmospheric-glow-bottom absolute left-[15%] -bottom-[120px] w-[620px] h-[400px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(198, 106, 61, 0.05) 0%, rgba(231, 225, 215, 0.3) 50%, transparent 80%)' }}
        />
        {/* Subtle Forest Green Depth Glow */}
        <div
          className="atmospheric-glow-right absolute -right-[140px] top-[20%] w-[540px] h-[620px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(38, 59, 50, 0.04) 0%, rgba(231, 225, 215, 0.25) 60%, transparent 80%)' }}
        />
      </div>

      {/* Fixed Sidebar on the left (172px width on md+) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSignOut={handleSignOut}
        workspaceName={currentProject ? currentProject.name : 'X'}
        onWorkspaceClick={handleNavigateDashboard}
      />

      {/* Main Layout Area: offset by 172px on desktop (md+) */}
      <div className="md:pl-[172px] flex flex-col min-h-screen relative z-10">
        {/* Top Header */}
        <TopHeader
          onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
          userName={displayName}
          userPlan={userPlan}
          userInitials={userInitials}
          onSignOut={handleSignOut}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="w-full flex-1 overflow-y-auto bg-transparent">
          {currentView === 'dashboard' ? (
            <Dashboard
              onCreateProject={() => setIsCreateModalOpen(true)}
              onSelectProject={handleSelectProject}
              onViewAllProjects={handleNavigateMyProjects}
              userProjects={userProjects}
              isLoadingProjects={isLoadingProjects}
              loadError={projectsError}
              onRetryProjects={handleRetryProjects}
            />
          ) : (
            <ProjectWorkspace
              projectId={currentProject ? currentProject.projectId : undefined}
              projectName={currentProject ? currentProject.name : selectedProjectName}
              projectDescription={currentProject ? currentProject.description : undefined}
              onNavigateDashboard={handleNavigateDashboard}
              onNavigateMyProjects={handleNavigateMyProjects}
              onCreateProject={() => setIsCreateModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Create Project Modal Dialog */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Settings & Theme Modal Dialog */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSignOut={handleSignOut}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
