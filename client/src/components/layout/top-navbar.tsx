import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  MenuIcon, 
  SearchIcon, 
  BellIcon, 
  HelpCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  UsersIcon,
  GiftIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function TopNavBar({ 
  setIsMobileOpen 
}: { 
  setIsMobileOpen: (open: boolean) => void 
}) {
  const [location] = useLocation();
  
  // Generate breadcrumbs based on current location
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.split('/').filter(Boolean);
    
    if (paths.length === 0) {
      return [{ label: 'Dashboard' }];
    }
    
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Add Dashboard as first item with link unless we're on dashboard
    // if (location !== '/') {
    //   breadcrumbs.push({ label: 'Dashboard', href: '/' });
    // } else {
    //   breadcrumbs.push({ label: 'Dashboard' });
    //   return breadcrumbs;
    // }
    
    // Special case for shows section
    if (paths[0] === 'shows') {
      breadcrumbs.push({ label: 'Shows', href: '/shows/calendar' });
      
      if (paths[1] === 'calendar') {
        breadcrumbs.push({ label: 'Calendar View' });
      } else if (paths[1] === 'list') {
        breadcrumbs.push({ label: 'List View' });
      } else if (paths[1] === 'builder') {
        breadcrumbs.push({ label: 'Show Builder' });
      }
      
      return breadcrumbs;
    }
    
    // Handle other sections
    const sectionMap: Record<string, string> = {
      'notifications': 'Notifications',
      'crew-members': 'Crew Members',
      'crew-schedule': 'Crew Schedule',
      'jobs': 'Jobs',
      'resources': 'Resources',
      'reports': 'Reports & Analytics',
      'settings': 'Settings',
    };
    
    const section = paths[0];
    if (sectionMap[section]) {
      breadcrumbs.push({ label: sectionMap[section] });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-500 hover:text-gray-700 mr-4"
          onClick={() => setIsMobileOpen(true)}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
        
        {/* Breadcrumb */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <ChevronRightIcon className="text-gray-400 mx-1 h-4 w-4" />
                )}
                
                {item.href ? (
                  <Link href={item.href} className="text-gray-700 hover:text-primary text-md font-medium">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 text-md font-medium">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="relative hidden sm:block w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          <Input 
            type="text" 
            placeholder="Search..." 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg pl-10"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 relative">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
        
        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256" alt="User profile" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Sarah Johnson</p>
                <p className="text-xs leading-none text-muted-foreground">
                  Production Manager
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GiftIcon className="mr-2 h-4 w-4" />
              <span>Refer and earn</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UsersIcon className="mr-2 h-4 w-4" />
              <span>Create Team</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default TopNavBar;
