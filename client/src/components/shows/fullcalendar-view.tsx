import { useState, useMemo, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { useShowStaffing } from "@/hooks/use-show-staffing";
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
  workspaceId: string;
};

export function FullCalendarView() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('dayGridMonth');

  // State for calendar date range
  const [calendarView, setCalendarView] = useState({ start: new Date(), end: new Date() });

  // Query calendar data with recurrence expansion
  const { data: calendarData = [] } = useQuery({
    queryKey: [`/api/calendar`, calendarView.start.toISOString(), calendarView.end.toISOString(), currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const params = new URLSearchParams({
        start: calendarView.start.toISOString(),
        end: calendarView.end.toISOString(),
        workspaceId: currentWorkspace.id
      });
      const response = await fetch(`/api/calendar?${params}`);
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      return response.json();
    },
    enabled: !!currentWorkspace?.id,
  });

  // Fallback query for shows data (for other components)
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
  
  // Use shared staffing hook
  const { getCrewStaffingStatus, crewAssignmentQueries, requiredJobQueries } = useShowStaffing(showIds);
  
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

  // Function to get show resources using show-specific data
  const getShowResources = (showId: string) => {
    const showResources = showResourceQueries.data?.[showId] || [];
    return showResources.map((sr: any) => {
      const resource = (resources as any[]).find((r: any) => r.id === sr.resourceId);
      return resource;
    }).filter(Boolean);
  };



  // Handle calendar view changes to update date range
  const handleDatesSet = (dateInfo: any) => {
    setCalendarView({
      start: dateInfo.start,
      end: dateInfo.end
    });
  };

  // Convert calendar events to FullCalendar format
  const calendarEvents = useMemo(() => {
    return calendarData.map((event: any) => {
      // Use event's color field or fallback to default
      const backgroundColor = event.color || '#3b82f6';
      const textColor = getContrastTextColor(backgroundColor);

      return {
        id: event.id,
        title: event.title,
        start: event.startTime,
        end: event.endTime,
        backgroundColor,
        borderColor: backgroundColor,
        textColor,
        extendedProps: {
          status: event.status,
          description: event.description,
          parentId: event.parentId,
          isRecurrence: event.isRecurrence,
          isException: event.isException,
          recurringPattern: event.recurringPattern,
          notes: event.notes,
        },
      };
    });
  }, [calendarData]);

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

  // Auto-scroll to current time on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        // Get current time and scroll to it
        const now = new Date();
        const currentHour = now.getHours() - 2;
        const currentMinute = now.getMinutes();
        
        // Format time as HH:mm:ss for scrollToTime
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
        
        // Only scroll if we're in a time grid view
        const currentView = calendarApi.view.type;
        if (currentView.includes('timeGrid')) {
          calendarApi.scrollToTime(timeString);
        }
      }
    }, 500); // Longer delay to ensure calendar is fully rendered

    return () => clearTimeout(timer);
  }, [viewMode, calendarEvents]); // Re-run when view mode or events change

  // Additional effect to scroll when calendar first loads
  useEffect(() => {
    if (calendarEvents.length > 0) {
      const timer = setTimeout(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          const now = new Date();
          const currentHour = now.getHours() - 2;
          const currentMinute = now.getMinutes();
          const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
          
          const currentView = calendarApi.view.type;
          if (currentView.includes('timeGrid')) {
            calendarApi.scrollToTime(timeString);
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [calendarEvents]);

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
            right: 'timeGridWeek,timeGridDay,dayGridMonth'
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
          events={calendarEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={renderEventContent}
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          height="900px"
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
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:15:00"
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