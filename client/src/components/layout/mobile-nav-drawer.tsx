import { useState } from "react";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Clock, 
  Briefcase, 
  Package, 
  BarChart3, 
  Plus,
  ChevronRight,
  Settings,
  UserPlus,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workspace } from "@shared/schema";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentWorkspace?: Workspace;
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Shows",
    icon: Calendar,
    items: [
      { title: "Calendar View", href: "/shows/calendar" },
      { title: "List View", href: "/shows/list" },
      { title: "Show Builder", href: "/shows/builder" }
    ]
  },
  {
    title: "Crew Schedule",
    href: "/crew-schedule",
    icon: Clock,
  },
  {
    title: "Crew Members",
    href: "/crew-members",
    icon: Users,
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Resources",
    href: "/resources",
    icon: Package,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    badge: "New"
  }
];

export function MobileNavDrawer({ isOpen, onOpenChange, currentWorkspace }: MobileNavDrawerProps) {
  const [location, setLocation] = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Shows']);
  const { toast } = useToast();

  const { data: workspaces = [] } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const response = await fetch('/api/workspaces');
      return response.json();
    }
  });

  const switchWorkspaceMutation = useMutation({
    mutationFn: async (workspaceSlug: string) => {
      return apiRequest("POST", "/api/workspaces/switch", { workspaceSlug });
    },
    onSuccess: (_, workspaceSlug) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      setLocation(`/workspaces/${workspaceSlug}/dashboard`);
      onOpenChange(false);
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

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "" || 
             location === "/dashboard" ||
             (currentWorkspace && location === `/workspaces/${currentWorkspace.slug}`) ||
             (currentWorkspace && location === `/workspaces/${currentWorkspace.slug}/dashboard`);
    }
    
    if (currentWorkspace) {
      const workspaceHref = `/workspaces/${currentWorkspace.slug}${href}`;
      return location === href || location === workspaceHref || location.startsWith(workspaceHref);
    }
    
    return location === href || location.startsWith(href);
  };

  const getWorkspaceBasePath = () => {
    return currentWorkspace ? `/workspaces/${currentWorkspace.slug}` : "";
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const handleWorkspaceSwitch = (workspace: Workspace) => {
    if (workspace.slug !== currentWorkspace?.slug) {
      switchWorkspaceMutation.mutate(workspace.slug);
    }
  };

  const handleNavigation = (href: string) => {
    setLocation(href);
    onOpenChange(false);
  };

  const getWorkspaceInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            {currentWorkspace ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center text-lg font-medium">
                    {getWorkspaceInitial(currentWorkspace.name)}
                  </div>
                  <div className="flex-1 text-left">
                    <SheetTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {currentWorkspace.name}
                    </SheetTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Badge variant="outline">Free Plan</Badge>
                      <span>•</span>
                      <span>1 member</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Invite
                  </Button>
                </div>
              </div>
            ) : (
              <SheetTitle>Navigation</SheetTitle>
            )}
          </SheetHeader>

          {workspaces.length > 1 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Switch Workspace
              </div>
              <div className="space-y-1">
                {workspaces.map((workspace: Workspace) => (
                  <Button
                    key={workspace.id}
                    variant="ghost"
                    onClick={() => handleWorkspaceSwitch(workspace)}
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-medium">
                        {getWorkspaceInitial(workspace.name)}
                      </div>
                      <span className="flex-1 text-left">{workspace.name}</span>
                      {workspace.slug === currentWorkspace?.slug && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                if (item.items) {
                  const isExpanded = expandedSections.includes(item.title) || item.items.some(subItem => isActiveRoute(subItem.href));
                  
                  return (
                    <div key={item.title} className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSection(item.title)}
                        className="w-full justify-between h-12 px-3 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-90"
                          )} 
                        />
                      </Button>
                      {isExpanded && (
                        <div className="space-y-1 ml-8">
                          {item.items.map((subItem) => (
                            <Button
                              key={subItem.href}
                              variant={isActiveRoute(subItem.href) ? "secondary" : "ghost"}
                              onClick={() => handleNavigation(`${getWorkspaceBasePath()}${subItem.href}`)}
                              className={cn(
                                "w-full justify-start h-11 px-3",
                                isActiveRoute(subItem.href) 
                                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                                  : "text-gray-600 dark:text-gray-400"
                              )}
                            >
                              {subItem.title}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                const href = item.href ? `${getWorkspaceBasePath()}${item.href}` : "#";
                
                return (
                  <Button
                    key={item.title}
                    variant={isActiveRoute(item.href || "") ? "secondary" : "ghost"}
                    onClick={() => handleNavigation(href)}
                    className={cn(
                      "w-full justify-start h-12 px-3",
                      isActiveRoute(item.href || "") 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="flex-1 text-left font-medium">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </nav>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quick Actions
              </div>
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="w-full justify-start h-12 px-3 text-gray-600 dark:text-gray-400"
              >
                <Plus className="h-5 w-5 mr-3" />
                <span className="font-medium">New Show</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="w-full justify-start h-12 px-3 text-gray-600 dark:text-gray-400"
              >
                <Users className="h-5 w-5 mr-3" />
                <span className="font-medium">Add Crew Member</span>
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="w-full justify-start h-12 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="font-medium">Log out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}