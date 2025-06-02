import * as React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "./use-toast";

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

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    localStorage.getItem("currentWorkspaceId")
  );
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/workspaces"]
  });
  
  const workspaces = Array.isArray(data) ? data as Workspace[] : [];

  // Set default workspace if none is selected
  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && !currentWorkspaceId) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, currentWorkspaceId, isLoading]);

  // Ensure workspace is valid or reset to first available
  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && currentWorkspaceId) {
      const workspaceExists = workspaces.find(w => w.id === currentWorkspaceId);
      if (!workspaceExists) {
        setCurrentWorkspaceId(workspaces[0].id);
      }
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

  const contextValue = {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceId,
    isLoading
  };

  return React.createElement(
    WorkspaceContext.Provider,
    { value: contextValue },
    children
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);