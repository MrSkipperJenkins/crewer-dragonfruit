import { useState, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { getContrastTextColor } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FilterIcon, 
  UploadIcon,
  PlusIcon,
  CalendarIcon,
  UsersIcon
} from "lucide-react";
import ShowDetailModal from "./show-detail-modal";

type Show = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  description?: string;
  workspaceId: string;
  color?: string;
};

type Resource = {
  id: string;
  name: string;
  type: string;
  workspaceId: string;
};

type ShowResource = {
  id: string;
  showId: string;
  resourceId: string;
  workspaceId: string;
};

type ShowCategory = {
  id: string;
  title: string;
  workspaceId: string;
};

type ShowCategoryAssignment = {
  id: string;
  showId: string;
  categoryId: string;
};

type CrewAssignment = {
  id: string;
  showId: string;
  crewMemberId: string;
  jobId: string;
  status: string;
  workspaceId: string;
};

type RequiredJob = {
  id: string;
  showId: string;
  jobId: string;
  quantity: number;
  workspaceId: string;
};

export function FullCalendarView() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('dayGridMonth');

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
  
  // Query show categories data
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-categories`],
    enabled: !!currentWorkspace?.id,
  });

  // Query show category assignments data
  const { data: categoryAssignments = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-category-assignments`],
    enabled: !!currentWorkspace?.id,
  });

  // Update show mutation
  const updateShowMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Show> }) => {
      return apiRequest("PUT", `/api/shows/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`] });
      toast({
        title: "Success",
        description: "Show updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update show",
        variant: "destructive",
      });
    },
  });

  // Function to get show category
  const getShowCategory = (showId: string) => {
    const assignment = categoryAssignments.find(
      (ca: ShowCategoryAssignment) => ca.showId === showId
    );
    
    if (!assignment) return null;
    
    return categories.find(
      (c: ShowCategory) => c.id === assignment.categoryId
    );
  };

  // Query all show-specific data for the shows we have
  const showIds = (shows as any[]).map((show: any) => show.id);
  
  // Query show resources for all shows
  const showResourceQueries = useQuery({
    queryKey: [`/api/show-resources-batch`, showIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const showId of showIds) {
        try {
          const response = await fetch(`/api/shows/${showId}/resources`);
          if (response.ok) {
            results[showId] = await response.json();
          } else {
            results[showId] = [];
          }
        } catch {
          results[showId] = [];
        }
      }
      return results;
    },
    enabled: showIds.length > 0,
  });

  // Query crew assignments for all shows
  const crewAssignmentQueries = useQuery({
    queryKey: [`/api/crew-assignments-batch`, showIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const showId of showIds) {
        try {
          const response = await fetch(`/api/shows/${showId}/crew-assignments`);
          if (response.ok) {
            results[showId] = await response.json();
          } else {
            results[showId] = [];
          }
        } catch {
          results[showId] = [];
        }
      }
      return results;
    },
    enabled: showIds.length > 0,
  });

  // Query required jobs for all shows
  const requiredJobQueries = useQuery({
    queryKey: [`/api/required-jobs-batch`, showIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const showId of showIds) {
        try {
          const response = await fetch(`/api/shows/${showId}/required-jobs`);
          if (response.ok) {
            results[showId] = await response.json();
          } else {
            results[showId] = [];
          }
        } catch {
          results[showId] = [];
        }
      }
      return results;
    },
    enabled: showIds.length > 0,
  });

  // Function to get show resources using show-specific data
  const getShowResources = (showId: string) => {
    const showResources = showResourceQueries.data?.[showId] || [];
    return showResources.map((sr: any) => {
      const resource = (resources as any[]).find((r: any) => r.id === sr.resourceId);
      return resource;
    }).filter(Boolean);
  };

  // Function to get crew staffing status for a show
  const getCrewStaffingStatus = (showId: string) => {
    const showRequiredJobs = requiredJobQueries.data?.[showId] || [];
    const showCrewAssignments = crewAssignmentQueries.data?.[showId] || [];
    
    const totalRequired = showRequiredJobs.reduce((sum: number, job: any) => sum + (job.quantity || 0), 0);
    const totalAssigned = showCrewAssignments.filter((ca: any) => ca.status === 'confirmed').length;
    
    return {
      assigned: totalAssigned,
      required: totalRequired,
      isFullyStaffed: totalAssigned >= totalRequired
    };
  };

  // Convert shows to FullCalendar events
  const calendarEvents = useMemo(() => {
    let filteredShows = shows;
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filteredShows = shows.filter((show: Show) => {
        const category = getShowCategory(show.id);
        return category && category.id === categoryFilter;
      });
    }

    return filteredShows.map((show: Show) => {
      const category = getShowCategory(show.id);
      const showResourceList = getShowResources(show.id);
      const crewStatus = getCrewStaffingStatus(show.id);
      
      // Use show's color field or fallback to default
      const backgroundColor = show.color || '#3b82f6';
      const textColor = getContrastTextColor(backgroundColor);

      return {
        id: show.id,
        title: show.title,
        start: show.startTime,
        end: show.endTime,
        backgroundColor,
        borderColor: backgroundColor,
        textColor,
        extendedProps: {
          status: show.status,
          description: show.description,
          category: category?.title || 'Uncategorized',
          resources: showResourceList.map((r: Resource) => r.name).join(', ') || 'No resources assigned',
          crewStatus: crewStatus,
        },
      };
    });
  }, [shows, categoryFilter, categoryAssignments, categories, resources, showResourceQueries.data, crewAssignmentQueries.data, requiredJobQueries.data]);

  // Handle event click
  const handleEventClick = (info: any) => {
    setSelectedShow(info.event.id);
  };

  // Handle event drop (drag & drop)
  const handleEventDrop = (info: any) => {
    const { event } = info;
    const updates = {
      startTime: event.start.toISOString(),
      endTime: event.end ? event.end.toISOString() : event.start.toISOString(),
    };
    
    updateShowMutation.mutate({ id: event.id, updates });
  };

  // Handle event resize
  const handleEventResize = (info: any) => {
    const { event } = info;
    const updates = {
      endTime: event.end ? event.end.toISOString() : event.start.toISOString(),
    };
    
    updateShowMutation.mutate({ id: event.id, updates });
  };

  // Custom event content renderer
  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const { extendedProps } = event;
    const { crewStatus } = extendedProps;
    
    // Format resources display
    const resourcesText = extendedProps.resources && extendedProps.resources !== 'No resources assigned' 
      ? extendedProps.resources.length > 30 
        ? `${extendedProps.resources.substring(0, 30)}...`
        : extendedProps.resources
      : 'No resources';
    
    // Format crew status display with null checks
    const safeCrewStatus = crewStatus || { assigned: 0, required: 0, isFullyStaffed: false };
    const crewText = safeCrewStatus.required > 0 
      ? `${safeCrewStatus.assigned} of ${safeCrewStatus.required} crew assigned`
      : 'No crew needed';
    
    const isFullyStaffed = safeCrewStatus.isFullyStaffed && safeCrewStatus.required > 0;
    const crewStatusColor = isFullyStaffed ? 'text-green-200' : safeCrewStatus.required > 0 ? 'text-yellow-200' : 'text-gray-300';
    
    return (
      <div className="fc-event-main-frame">
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky font-medium text-xs leading-tight">
            {event.title}
          </div>
        </div>
        <div className="text-xs opacity-90 mt-1 space-y-0.5">
          <div className="truncate">
            {resourcesText}
          </div>
          <div className={`${crewStatusColor} font-medium`}>
            {crewText}
          </div>
        </div>
      </div>
    );
  };

  // Navigation functions
  const goToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  };

  const changeView = (view: string) => {
    setViewMode(view);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Page Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="h-4 w-4 text-gray-400" />
              </div>
              <Select 
                value={categoryFilter} 
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 pr-8 py-2 h-10 w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: ShowCategory) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.title}
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



      {/* FullCalendar Component */}
      <div className="p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={renderEventContent}
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          height="auto"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          nowIndicator={true}
          weekNumbers={false}
          dayHeaders={true}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          snapDuration="00:15:00"
          slotLabelInterval="01:00:00"
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
            startTime: '08:00',
            endTime: '22:00',
          }}
          weekends={true}
        />
      </div>

      {/* Show Detail Modal */}
      {selectedShow && (
        <ShowDetailModal
          showId={selectedShow}
          onClose={() => setSelectedShow(null)}
        />
      )}
    </div>
  );
}

export default FullCalendarView;