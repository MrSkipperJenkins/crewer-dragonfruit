import { useState, useMemo } from "react";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { cn, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  UploadIcon,
  PlusIcon,
  CalendarIcon,
  UsersIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ShowDetailModal from "./show-detail-modal";

type Show = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
};

type Resource = {
  id: string;
  name: string;
  type: string;
};

type ShowResource = {
  id: string;
  showId: string;
  resourceId: string;
};

type ShowCategory = {
  id: string;
  name: string;
  color: string;
};

type ShowCategoryAssignment = {
  id: string;
  showId: string;
  categoryId: string;
};

export function CalendarView() {
  const { currentWorkspace } = useCurrentWorkspace();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"today" | "week" | "month">("week");
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Get dates based on view mode
  const displayDates = useMemo(() => {
    if (viewMode === "today") {
      return [currentDate];
    } else if (viewMode === "week") {
      const sunday = startOfWeek(currentDate, { weekStartsOn: 0 });
      return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
    } else {
      // Month view - get all days in the month
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfMonth(currentDate);
      const days = [];
      let day = start;
      while (day <= end || days.length < 35) {
        days.push(day);
        day = addDays(day, 1);
        if (days.length >= 35) break;
      }
      return days;
    }
  }, [currentDate, viewMode]);

  // Format display text based on view mode
  const displayText = useMemo(() => {
    if (viewMode === "today") {
      return format(currentDate, "MMMM d, yyyy");
    } else if (viewMode === "week") {
      return format(displayDates[0], "MMMM yyyy");
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  }, [displayDates, currentDate, viewMode]);

  // Query shows data
  const { data: shows = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
    enabled: !!currentWorkspace?.id,
  });

  // Query resources data
  const { data: resources = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/resources`],
    enabled: !!currentWorkspace?.id,
  });

  // Query show resources data
  const { data: showResources = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-resources`],
    enabled: !!currentWorkspace?.id,
  });

  // Query show categories data
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-categories`],
    enabled: !!currentWorkspace?.id,
  });

  // Query show category assignments data
  const { data: categoryAssignments = [] } = useQuery({
    queryKey: [
      `/api/workspaces/${currentWorkspace?.id}/show-category-assignments`,
    ],
    enabled: !!currentWorkspace?.id,
  });

  // Navigation functions
  const goToToday = () => {
    setCurrentDate(new Date());
    setViewMode("today");
  };

  const goToPrevious = () => {
    if (viewMode === "today" || viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "today" || viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  // Group resources by type for display
  const resourcesByType = useMemo(() => {
    const grouped: Record<string, Resource[]> = {};

    resources.forEach((resource: Resource) => {
      if (!grouped[resource.type]) {
        grouped[resource.type] = [];
      }
      grouped[resource.type].push(resource);
    });

    return grouped;
  }, [resources]);

  // Function to get show category
  const getShowCategory = (showId: string) => {
    const assignment = categoryAssignments.find(
      (ca: ShowCategoryAssignment) => ca.showId === showId,
    );

    if (!assignment) return null;

    return categories.find((c: ShowCategory) => c.id === assignment.categoryId);
  };

  // Filter shows if a category is selected
  const filteredShows = useMemo(() => {
    if (categoryFilter === "all") return shows;

    return shows.filter((show: Show) => {
      const category = getShowCategory(show.id);
      return category && category.id === categoryFilter;
    });
  }, [shows, categoryFilter, categoryAssignments, categories]);

  // Function to handle show click
  const handleShowClick = (showId: string) => {
    setSelectedShow(showId);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setSelectedShow(null);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Page Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Shows Calendar
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage upcoming shows across all resources
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="h-4 w-4 text-gray-400" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 pr-8 py-2 h-10 w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: ShowCategory) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" className="h-10">
              <UploadIcon className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button size="sm" className="h-10">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Show
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevious}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToNext}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-medium text-gray-900 ml-2">
            {displayText}
          </h2>
        </div>

        <div className="flex bg-white rounded-md shadow-sm border border-gray-300">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "px-3 py-1.5 text-sm font-medium border-r border-gray-300 rounded-none",
              viewMode === "today"
                ? "bg-primary-50 text-primary-700"
                : "hover:bg-gray-100 hover:text-gray-900",
            )}
            onClick={goToToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-none",
              viewMode === "week"
                ? "bg-primary-50 text-primary-700"
                : "hover:bg-gray-100 hover:text-gray-900",
            )}
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "px-3 py-1.5 text-sm font-medium border-l border-gray-300 rounded-none",
              viewMode === "month"
                ? "bg-primary-50 text-primary-700"
                : "hover:bg-gray-100 hover:text-gray-900",
            )}
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-9">
            <CalendarIcon className="mr-1 h-4 w-4" />
            Resources
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <UsersIcon className="mr-1 h-4 w-4" />
            Crew
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="calendar-grid min-w-[800px]">
          {/* Calendar Header */}
          <div
            className={cn(
              "calendar-header bg-gray-50 border-b border-gray-200 grid",
              viewMode === "today"
                ? "grid-cols-1"
                : viewMode === "week"
                  ? "grid-cols-7"
                  : "grid-cols-7",
            )}
          >
            {displayDates
              .slice(0, viewMode === "today" ? 1 : 7)
              .map((date, index) => {
                const isToday = isSameDay(date, new Date());
                const dayLabel = format(date, "EEE");
                const dateLabel = format(date, "MMM d");

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 border-r border-gray-200 font-medium text-center min-h-[60px]",
                      isToday
                        ? "text-primary-600 bg-primary-50"
                        : "text-gray-500",
                    )}
                  >
                    <div className="text-xs uppercase tracking-wide">
                      {dayLabel}
                    </div>
                    <div className="text-lg font-semibold mt-1">
                      {format(date, "d")}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Resources and Shows */}
          {Object.entries(resourcesByType).map(([type, typeResources]) => (
            <div key={type}>
              {/* Resource Type Header */}
              <div className="bg-gray-100 border-b border-gray-200 p-3">
                <h3 className="font-medium text-gray-700 text-sm">
                  {type === "studio"
                    ? "Studios"
                    : type === "control_room"
                      ? "Control Rooms"
                      : "Equipment"}
                </h3>
              </div>

              {/* Resources of this type */}
              {typeResources.map((resource) => (
                <div key={resource.id} className="flex">
                  <div className="w-48 bg-gray-50 border-r border-b border-gray-200 p-3 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700">
                      {resource.name}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "flex-1 border-b border-gray-200 grid",
                      viewMode === "today"
                        ? "grid-cols-1"
                        : viewMode === "week"
                          ? "grid-cols-7"
                          : "grid-cols-7",
                    )}
                  >
                    {displayDates
                      .slice(0, viewMode === "today" ? 1 : 7)
                      .map((date, index) => {
                        const isToday = isSameDay(date, new Date());
                        const dayShows = filteredShows.filter((show: Show) => {
                          // Filter shows for this resource and date
                          const showDate = new Date(show.startTime);
                          const isShowForThisResource = showResources.some(
                            (sr: ShowResource) =>
                              sr.showId === show.id &&
                              sr.resourceId === resource.id,
                          );

                          return (
                            isShowForThisResource && isSameDay(showDate, date)
                          );
                        });

                        return (
                          <div
                            key={index}
                            className={cn(
                              "min-h-[100px] border-r border-gray-200 relative p-2",
                              isToday && "bg-primary-50",
                            )}
                          >
                            {dayShows.map((show: Show) => {
                              const category = getShowCategory(show.id);
                              const colorStyle = category
                                ? { borderLeftColor: category.color }
                                : undefined;

                              return (
                                <div
                                  key={show.id}
                                  className="mb-2 bg-blue-100 border-l-4 border-blue-500 rounded-sm p-2 text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                                  style={colorStyle}
                                  onClick={() => handleShowClick(show.id)}
                                >
                                  <div className="font-medium text-gray-900">
                                    {show.title}
                                  </div>
                                  <div className="text-gray-600 mt-1">
                                    {formatTime(show.startTime)} -{" "}
                                    {formatTime(show.endTime)}
                                  </div>
                                  <div className="mt-1 text-gray-500 text-xs">
                                    {show.status}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Show Detail Modal */}
      {selectedShow && (
        <ShowDetailModal showId={selectedShow} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default CalendarView;
