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

    if (location.includes("/dashboard") || location === "/") {
      breadcrumbs.push({ label: "Dashboard" });
    } else if (location.includes("/shows")) {
      breadcrumbs.push({ 
        label: "Shows",
        href: "/shows/list"
      });

      if (location.includes("/list")) {
        breadcrumbs.push({ label: "List View" });
      } else if (location.includes("/calendar")) {
        breadcrumbs.push({ label: "Calendar View" });
      } else if (location.includes("/builder") || location.includes("/create")) {
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
    } else if (location.includes("/crew-schedule")) {
      breadcrumbs.push({ 
        label: "Crew Schedule"
      });
    } else if (location.includes("/crew")) {
      breadcrumbs.push({ 
        label: "Crew Members"
      });
    } else if (location.includes("/resources")) {
      breadcrumbs.push({ 
        label: "Resources"
      });
    } else if (location.includes("/jobs")) {
      breadcrumbs.push({ 
        label: "Job Roles"
      });
    } else if (location.includes("/settings")) {
      breadcrumbs.push({ 
        label: "Settings"
      });
    } else if (location.includes("/analytics")) {
      breadcrumbs.push({ 
        label: "Analytics"
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