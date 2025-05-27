import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Workspace } from "@shared/schema";

interface CurrentWorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  isLoading: boolean;
}

const CurrentWorkspaceContext = createContext<CurrentWorkspaceContextType | undefined>(undefined);

export function CurrentWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [location] = useLocation();

  // Get all workspaces
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const response = await fetch('/api/workspaces');
      return response.json();
    }
  });

  // Extract workspace slug from URL and set current workspace
  useEffect(() => {
    if (!workspaces.length) return;

    // Check if we're in a workspace-specific route
    const workspaceMatch = location.match(/^\/workspaces\/([^\/]+)/);
    
    if (workspaceMatch) {
      const slug = workspaceMatch[1];
      const workspace = workspaces.find((w: Workspace) => w.slug === slug);
      if (workspace && workspace.id !== currentWorkspace?.id) {
        setCurrentWorkspace(workspace);
      }
    } else {
      // For non-workspace routes, use the first workspace as default
      if (!currentWorkspace && workspaces.length > 0) {
        setCurrentWorkspace(workspaces[0]);
      }
    }
  }, [location, workspaces, currentWorkspace]);

  return (
    <CurrentWorkspaceContext.Provider value={{
      currentWorkspace,
      setCurrentWorkspace,
      isLoading
    }}>
      {children}
    </CurrentWorkspaceContext.Provider>
  );
}

export function useCurrentWorkspace() {
  const context = useContext(CurrentWorkspaceContext);
  if (context === undefined) {
    throw new Error('useCurrentWorkspace must be used within a CurrentWorkspaceProvider');
  }
  return context;
}