import { useLocation } from "wouter";
import { WorkspaceNavbar } from "./workspace-navbar";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { currentWorkspace, isLoading } = useCurrentWorkspace();
  const [location] = useLocation();

  // Generate page title based on current route
  const getPageTitle = () => {
    if (location === "/" || location === "") return "Dashboard";
    if (location.startsWith("/shows/calendar")) return "Shows • Calendar View";
    if (location.startsWith("/shows/list")) return "Shows • List View";
    if (location.startsWith("/shows/builder")) return "Show Builder";
    if (location.startsWith("/shows")) return "Shows";
    if (location.startsWith("/crew-members")) return "Crew Members";
    if (location.startsWith("/crew-schedule")) return "Crew Schedule";
    if (location.startsWith("/jobs")) return "Jobs";
    if (location.startsWith("/resources")) return "Resources";
    if (location.startsWith("/reports")) return "Reports";
    if (location.startsWith("/notifications")) return "Notifications";
    if (location.startsWith("/settings")) return "Settings";
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overscroll-none">
      {/* Top Navbar */}
      <WorkspaceNavbar
        currentWorkspace={currentWorkspace || undefined}
        pageTitle={getPageTitle()}
      />
      <div className="flex flex-1 overflow-hidden overscroll-none">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block">
          <WorkspaceSidebar currentWorkspace={currentWorkspace || undefined} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-white dark:bg-gray-900 main-content">
          <div className="p-6 h-full bg-[#fafafa]">{children}</div>
        </main>
      </div>
    </div>
  );
}
