import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Search, Plus, Bell, Settings, Users, LogOut, UserPlus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import type { Workspace } from "@shared/schema";

interface WorkspaceNavbarProps {
  currentWorkspace?: Workspace;
  pageTitle?: string;
}

export function WorkspaceNavbar({ currentWorkspace, pageTitle }: WorkspaceNavbarProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get all workspaces for the dropdown
  const { data: workspaces = [] } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const response = await fetch('/api/workspaces');
      return response.json();
    }
  });

  // Get user notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/users/38ccfc25-287d-4ac1-b832-5a5f3a1b1575/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/users/38ccfc25-287d-4ac1-b832-5a5f3a1b1575/notifications');
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

  const unreadNotifications = notifications.filter((n: any) => !n.readAt).length;

  const getWorkspaceInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Mobile Hamburger + Desktop Workspace Selector */}
          <div className="flex items-center space-x-4">
            {/* Mobile Hamburger Menu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-11 h-11 p-0"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile Page Title */}
            <div className="lg:hidden">
              <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {pageTitle || 'Dashboard'}
              </h1>
            </div>

            {/* Desktop Workspace Selector */}
            <div className="hidden lg:block">
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
                        <div className="flex space-x-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setLocation(`/workspaces/${currentWorkspace.slug}/settings`)}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Settings
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Invite Team
                          </Button>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Switch Workspaces */}
                  {workspaces.length > 1 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Switch Workspace
                      </div>
                      {workspaces.map((workspace: Workspace) => (
                        <DropdownMenuItem 
                          key={workspace.id}
                          onClick={() => handleWorkspaceSwitch(workspace)}
                          className="p-3 cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-medium">
                              {getWorkspaceInitial(workspace.name)}
                            </div>
                            <span className="flex-1">{workspace.name}</span>
                            {workspace.slug === currentWorkspace?.slug && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Quick Actions */}
                  <DropdownMenuItem onClick={() => setLocation('/workspace-wizard')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Page Title */}
            <div className="hidden lg:block">
              {pageTitle && (
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {pageTitle}
                </h1>
              )}
            </div>
          </div>

          {/* Center: Spacer for layout balance */}
          <div className="hidden lg:block flex-1"></div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Search - Icons only on mobile */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-11 h-11 p-0"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative w-11 h-11 p-0"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-11 h-11 p-0">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
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

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        currentWorkspace={currentWorkspace}
      />
    </>
  );
}