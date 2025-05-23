import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export type Workspace = {
  id: string;
  name: string;
  createdAt: string;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceId: (id: string) => void;
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  currentWorkspace: null,
  setCurrentWorkspaceId: () => {},
  isLoading: true,
});

export function WorkspaceProvider({ children }) {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    localStorage.getItem("currentWorkspaceId")
  );
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/workspaces"]
  });
  
  const workspaces = Array.isArray(data) ? data : [];

  // Set default workspace if none is selected
  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && !currentWorkspaceId) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, currentWorkspaceId, isLoading]);

  // Persist current workspace to localStorage
  useEffect(() => {
    if (currentWorkspaceId) {
      localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
    }
  }, [currentWorkspaceId]);

  // Find the current workspace
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspaceId,
        isLoading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
