import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { 
  FilmIcon, 
  LayoutDashboardIcon, 
  BellIcon, 
  CalendarIcon, 
  TvIcon, 
  UsersIcon, 
  ClockIcon, 
  BriefcaseIcon, 
  BuildingIcon, 
  BarChartIcon, 
  SettingsIcon, 
  ChevronDownIcon, 
  LogOutIcon, 
  MenuIcon
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export function Sidebar({ isMobileOpen, setIsMobileOpen }: { 
  isMobileOpen: boolean; 
  setIsMobileOpen: (open: boolean) => void;
}) {
  const [location] = useLocation();
  const { currentWorkspace } = useWorkspace();
  
  // Fetch notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/users/38ccfc25-287d-4ac1-b832-5a5f3a1b1575/notifications'],
    enabled: !!currentWorkspace,
  });
  
  const unreadNotifications = notifications.filter((n: any) => !n.read).length;

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Navigation items
  const navItems = [
    { 
      href: "/", 
      icon: <LayoutDashboardIcon className="text-lg mr-3" />, 
      label: "Dashboard" 
    },
    { 
      href: "/notifications", 
      icon: <BellIcon className="text-lg mr-3" />, 
      label: "Notifications",
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
    { 
      href: "/calendar", 
      icon: <CalendarIcon className="text-lg mr-3" />, 
      label: "Calendar" 
    },
    { 
      href: "/shows", 
      icon: <TvIcon className="text-lg mr-3" />, 
      label: "Shows",
      submenu: [
        { href: "/shows/calendar", label: "Calendar View" },
        { href: "/shows/list", label: "List View" },
        { href: "/shows/builder", label: "Show Builder" }
      ]
    },
    { 
      href: "/crew-members", 
      icon: <UsersIcon className="text-lg mr-3" />, 
      label: "Crew Members" 
    },
    { 
      href: "/crew-schedule", 
      icon: <ClockIcon className="text-lg mr-3" />, 
      label: "Crew Schedule" 
    },
    { 
      href: "/jobs", 
      icon: <BriefcaseIcon className="text-lg mr-3" />, 
      label: "Jobs" 
    },
    { 
      href: "/resources", 
      icon: <BuildingIcon className="text-lg mr-3" />, 
      label: "Resources" 
    },
    { 
      href: "/reports", 
      icon: <BarChartIcon className="text-lg mr-3" />, 
      label: "Reports" 
    },
    { 
      href: "/settings", 
      icon: <SettingsIcon className="text-lg mr-3" />, 
      label: "Settings" 
    }
  ];

  const sidebarClasses = cn(
    "fixed md:relative inset-y-0 left-0 z-30 flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 h-full transition-transform duration-300 ease-in-out",
    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center mr-2">
              <FilmIcon size={20} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Crewer</h1>
          </div>
          <button 
            className="text-gray-500 hover:text-gray-700 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow p-4 space-y-6">
          {/* Workspace Selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Current Workspace</label>
            <Select defaultValue={currentWorkspace?.id}>
              <SelectTrigger className="w-full bg-gray-50 border border-gray-300 h-9">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentWorkspace?.id || ''}>
                  {currentWorkspace?.name || 'Select workspace'}
                </SelectItem>
                <SelectItem value="create">+ Create New Workspace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <div key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                      isActive(item.href) 
                        ? "bg-primary-50 text-primary-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge variant="default" className="ml-auto px-2 py-0.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {item.submenu && (
                      <ChevronDownIcon className="ml-auto h-5 w-5" />
                    )}
                  </a>
                </Link>
                
                {/* Submenu */}
                {item.submenu && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link key={subitem.href} href={subitem.href}>
                        <a
                          className={cn(
                            "flex items-center px-2 py-1.5 text-sm font-medium rounded-md",
                            isActive(subitem.href)
                              ? "text-primary-700"
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {subitem.label}
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256" alt="User profile" />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Sarah Johnson</p>
              <p className="text-xs text-gray-500">Production Manager</p>
            </div>
            <button className="ml-auto text-gray-500 hover:text-gray-700">
              <LogOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
