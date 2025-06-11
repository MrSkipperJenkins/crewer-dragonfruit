import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { ChevronRight } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb() {
  const [location, setLocation] = useLocation();
  const { currentWorkspace } = useCurrentWorkspace();

  // Extract show ID from URL if on show edit page
  const showEditMatch = location.match(/\/shows\/([^\/]+)\/edit/);
  const showId = showEditMatch ? showEditMatch[1] : null;

  // Fetch show data if on show edit page
  const { data: show } = useQuery({
    queryKey: [`/api/shows/${showId}`],
    enabled: !!showId,
  }) as { data: any };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with workspace name
    if (currentWorkspace) {
      breadcrumbs.push({
        label: currentWorkspace.name,
        href: `/workspaces/${currentWorkspace.slug}`
      });
    }

    // Debug logging
    console.log('Current location:', location);
    console.log('Show ID:', showId);
    console.log('Show data:', show);

    if (location === "/dashboard") {
      breadcrumbs.push({ label: "Dashboard" });
    } else if (location.startsWith("/shows")) {
      breadcrumbs.push({ 
        label: "Shows",
        href: "/shows/list"
      });

      if (location.includes("/list")) {
        breadcrumbs.push({ label: "List View" });
      } else if (location.includes("/calendar")) {
        breadcrumbs.push({ label: "Calendar View" });
      } else if (location.includes("/create")) {
        breadcrumbs.push({ label: "Create Show" });
      } else if (showId && show) {
        // Show edit page with detailed info
        const startDate = formatDate(show.startTime);
        const startTime = formatTime(show.startTime);
        const endTime = formatTime(show.endTime);
        
        breadcrumbs.push({ 
          label: `${show.title} • ${startTime} - ${endTime} • ${startDate}`
        });
      } else if (showId) {
        // Show loading state while data is being fetched
        breadcrumbs.push({ 
          label: "Loading..."
        });
      }
    } else if (location.startsWith("/crew")) {
      breadcrumbs.push({ 
        label: "Crew",
        href: "/crew"
      });
    } else if (location.startsWith("/resources")) {
      breadcrumbs.push({ 
        label: "Resources",
        href: "/resources"
      });
    } else if (location.startsWith("/jobs")) {
      breadcrumbs.push({ 
        label: "Job Roles",
        href: "/jobs"
      });
    } else if (location.startsWith("/settings")) {
      breadcrumbs.push({ 
        label: "Settings",
        href: "/settings"
      });
    } else if (location.startsWith("/analytics")) {
      breadcrumbs.push({ 
        label: "Analytics",
        href: "/analytics"
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
          )}
          {crumb.href && index < breadcrumbs.length - 1 ? (
            <button
              onClick={() => {
                if (crumb.href) {
                  setLocation(crumb.href);
                }
              }}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {crumb.label}
            </button>
          ) : (
            <span className={index === breadcrumbs.length - 1 ? "font-medium text-gray-900 dark:text-gray-100" : ""}>
              {crumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}