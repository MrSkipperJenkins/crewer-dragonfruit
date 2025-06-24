import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Clock, 
  Briefcase, 
  Package, 
  BarChart3, 
  Plus,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Workspace } from "@shared/schema";

interface WorkspaceSidebarProps {
  currentWorkspace?: Workspace;
  className?: string;
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: null
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
    title: "Templates",
    href: "/templates",
    icon: Layers,
    badge: "New"
  },
  {
    title: "Crew Schedule",
    href: "/crew-schedule",
    icon: Clock,
    badge: null
  },
  {
    title: "Crew Members",
    href: "/crew-members",
    icon: Users,
    badge: null
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    badge: null
  },
  {
    title: "Resources",
    href: "/resources",
    icon: Package,
    badge: null
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    badge: "New"
  }
];

export function WorkspaceSidebar({ currentWorkspace, className }: WorkspaceSidebarProps) {
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Shows']);

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "" || 
             location === "/dashboard" ||
             (currentWorkspace && location === `/workspaces/${currentWorkspace.slug}`) ||
             (currentWorkspace && location === `/workspaces/${currentWorkspace.slug}/dashboard`);
    }
    
    // For workspace-specific routes, check both legacy and workspace URLs
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

  return (
    <div className={cn(
      "w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen overscroll-none",
      className
    )}>
      {/* Main Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => {
            if (item.items) {
              // Expandable section
              const isExpanded = expandedSections.includes(item.title) || item.items.some(subItem => isActiveRoute(subItem.href));
              
              return (
                <div key={item.title} className="space-y-1">
                  <Button
                    variant="ghost"
                    onClick={() => toggleSection(item.title)}
                    className="w-full justify-between px-3 py-2 h-9 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <div className="flex items-center">
                      <item.icon className="h-4 w-4 mr-3" />
                      <span>{item.title}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-3 w-3 transition-transform",
                        isExpanded && "rotate-90"
                      )} 
                    />
                  </Button>
                  {isExpanded && (
                    <div className="space-y-1 ml-6">
                      {item.items.map((subItem) => (
                        <Link key={subItem.href} href={`${getWorkspaceBasePath()}${subItem.href}`}>
                          <Button
                            variant={isActiveRoute(subItem.href) ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start h-8 px-3 text-sm",
                              isActiveRoute(subItem.href) 
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            )}
                          >
                            {subItem.title}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Regular navigation item
            const href = item.href ? `${getWorkspaceBasePath()}${item.href}` : "#";
            
            return (
              <Link key={item.title} href={href}>
                <Button
                  variant={isActiveRoute(item.href || "") ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-9 px-3",
                    isActiveRoute(item.href || "") 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 my-4">
          <Separator />
        </div>

        {/* Quick Actions */}
        <div className="px-3 space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Quick Actions
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start h-9 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Plus className="h-4 w-4 mr-3" />
            New Show
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start h-9 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Users className="h-4 w-4 mr-3" />
            Add Crew Member
          </Button>
        </div>
      </div>


    </div>
  );
}