import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  MenuIcon, 
  SearchIcon, 
  BellIcon, 
  HelpCircleIcon,
  ChevronRightIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    if (location !== '/') {
      breadcrumbs.push({ label: 'Dashboard', href: '/' });
    } else {
      breadcrumbs.push({ label: 'Dashboard' });
      return breadcrumbs;
    }
    
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
      'crew-members': 'Crew Members',
      'crew-schedule': 'Crew Schedule',
      'jobs': 'Jobs',
      'resources': 'Resources',
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
                  <Link href={item.href}>
                    <a className="text-gray-700 hover:text-primary text-sm font-medium">
                      {item.label}
                    </a>
                  </Link>
                ) : (
                  <span className="text-gray-500 text-sm font-medium">
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
        
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
          <HelpCircleIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

export default TopNavBar;
