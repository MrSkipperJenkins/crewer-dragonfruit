import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Search, Plus, Bell, Settings, Users, LogOut, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workspace } from "@shared/schema";

interface WorkspaceNavbarProps {
  currentWorkspace?: Workspace;
  pageTitle?: string;
}

export function WorkspaceNavbar({ currentWorkspace, pageTitle }: WorkspaceNavbarProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get all workspaces for the dropdown
  const { data: workspaces = [] } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const response = await fetch('/api/workspaces');
      return response.json();
    }
  });

  // Switch workspace mutation
  const switchWorkspaceMutation = useMutation({
    mutationFn: async (workspaceSlug: string) => {
      return apiRequest("POST", "/api/workspaces/switch", { workspaceSlug });
    },
    onSuccess: (_, workspaceSlug) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      setLocation(`/workspaces/${workspaceSlug}/dashboard`);
      toast({
        title: "Workspace switched",
        description: "Successfully switched workspace"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch workspace",
        variant: "destructive"
      });
    }
  });

  const handleWorkspaceSwitch = (workspace: Workspace) => {
    if (workspace.slug !== currentWorkspace?.slug) {
      switchWorkspaceMutation.mutate(workspace.slug);
    }
  };

  const handleNewWorkspace = () => {
    setLocation("/workspaces/new");
  };

  const handleInviteMembers = () => {
    // TODO: Open invite dialog
    toast({
      title: "Coming soon",
      description: "Invite members feature will be available soon"
    });
  };

  const handleSettings = () => {
    if (currentWorkspace) {
      setLocation(`/workspaces/${currentWorkspace.slug}/settings`);
    }
  };

  const getWorkspaceInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Workspace Selector */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-medium">
                    {currentWorkspace ? getWorkspaceInitial(currentWorkspace.name) : 'W'}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              {/* Current Workspace Header */}
              {currentWorkspace && (
                <>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center text-lg font-medium">
                        {getWorkspaceInitial(currentWorkspace.name)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {currentWorkspace.name}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Badge variant="outline">Free Plan</Badge>
                          <span>•</span>
                          <span>1 member</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSettings}
                        className="flex-1"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Settings
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleInviteMembers}
                        className="flex-1"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Invite
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Workspace List */}
              <div className="p-1">
                <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wide px-2">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((workspace: Workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleWorkspaceSwitch(workspace)}
                    className="flex items-center space-x-3 px-2 py-2"
                  >
                    <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-medium">
                      {getWorkspaceInitial(workspace.name)}
                    </div>
                    <span className="flex-1">{workspace.name}</span>
                    {workspace.slug === currentWorkspace?.slug && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleNewWorkspace}
                  className="flex items-center space-x-3 px-2 py-2 text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  <span>New workspace</span>
                </DropdownMenuItem>
              </div>

              {/* Account Actions */}
              <DropdownMenuSeparator />
              <div className="p-1">
                <DropdownMenuItem className="flex items-center space-x-3 px-2 py-2">
                  <Users className="h-4 w-4" />
                  <span>Add another account</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-3 px-2 py-2 text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Page Title */}
          {pageTitle && (
            <>
              <div className="text-gray-300 dark:text-gray-600">/</div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {pageTitle}
              </span>
            </>
          )}
        </div>

        {/* Right: Global Actions */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>

          {/* New Show Button */}
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-3 w-3 mr-1" />
            New Show
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs">JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}