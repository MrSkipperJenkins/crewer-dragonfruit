import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon,
  Users,
  Clock,
  Plus,
  Edit
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { cn } from "@/lib/utils";

type ViewType = 'daily' | 'weekly';
type ShiftEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  extendedProps?: {
    crewMember: string;
    show?: string;
    type: 'shift' | 'show' | 'timeoff';
    notes?: string;
  };
};

export default function CrewSchedulePage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const [currentView, setCurrentView] = useState<ViewType>('daily');
  const [selectedEvent, setSelectedEvent] = useState<ShiftEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // Fetch crew members
  const { data: crewMembers = [], isLoading: isLoadingCrew } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-members`],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch shows for real data
  const { data: shows = [], isLoading: isLoadingShows } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch crew schedules (regular availability)
  const { data: crewSchedules = [], isLoading: isLoadingSchedules } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-schedules`],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch crew time off
  const { data: crewTimeOff = [], isLoading: isLoadingTimeOff } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-time-off`],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch all crew assignments for the workspace
  const fetchAllCrewAssignments = async () => {
    if (!currentWorkspace?.id) return [];
    
    const allAssignments: any[] = [];
    for (const show of (shows as any[])) {
      try {
        const response = await fetch(`/api/shows/${show.id}/crew-assignments`);
        if (response.ok) {
          const assignments = await response.json();
          allAssignments.push(...assignments.map((a: any) => ({ ...a, showId: show.id })));
        }
      } catch (error) {
        console.error(`Failed to fetch assignments for show ${show.id}:`, error);
      }
    }
    return allAssignments;
  };

  const { data: crewAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: [`/api/crew-assignments-all`, currentWorkspace?.id, shows],
    queryFn: fetchAllCrewAssignments,
    enabled: !!currentWorkspace?.id && (shows as any[]).length > 0,
  });

  // Effect to handle view changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(getCalendarView());
    }
  }, [currentView]);

  // Generate events from crew schedules, time off, and show assignments
  const generateEventsFromData = (): ShiftEvent[] => {
    const events: ShiftEvent[] = [];

    // Add show assignments as events
    (crewAssignments as any[]).forEach((assignment: any) => {
      const show = (shows as any[]).find((s: any) => s.id === assignment.showId);
      const crewMember = (crewMembers as any[]).find((cm: any) => cm.id === assignment.crewMemberId);
      
      if (show && crewMember) {
        events.push({
          id: `assignment-${assignment.id}`,
          title: `${show.title} - ${crewMember.name}`,
          start: show.startTime,
          end: show.endTime,
          backgroundColor: show.color || '#3b82f6',
          extendedProps: {
            crewMember: crewMember.name,
            show: show.title,
            type: 'show',
            notes: show.notes || ''
          }
        });
      }
    });

    // Add regular crew schedules as recurring availability blocks
    (crewSchedules as any[]).forEach((schedule: any) => {
      const crewMember = (crewMembers as any[]).find((cm: any) => cm.id === schedule.crewMemberId);
      
      if (crewMember) {
        // Generate events for the current week based on dayOfWeek
        const today = new Date();
        const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentWeekStart);
          date.setDate(currentWeekStart.getDate() + i);
          
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNames[date.getDay()];
          
          if (dayName === schedule.dayOfWeek) {
            const startTime = new Date(schedule.startTime);
            const endTime = new Date(schedule.endTime);
            
            // Combine date with time
            const eventStart = new Date(date);
            eventStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
            
            const eventEnd = new Date(date);
            eventEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
            
            events.push({
              id: `schedule-${schedule.id}-${date.toISOString().split('T')[0]}`,
              title: `Available - ${crewMember.name}`,
              start: eventStart.toISOString(),
              end: eventEnd.toISOString(),
              backgroundColor: '#10b981',
              extendedProps: {
                crewMember: crewMember.name,
                type: 'shift',
                notes: `Regular availability on ${schedule.dayOfWeek}`
              }
            });
          }
        }
      }
    });

    // Add time off events
    (crewTimeOff as any[]).forEach((timeOff: any) => {
      const crewMember = (crewMembers as any[]).find((cm: any) => cm.id === timeOff.crewMemberId);
      
      if (crewMember) {
        events.push({
          id: `timeoff-${timeOff.id}`,
          title: `${crewMember.name} - Time Off`,
          start: timeOff.startTime,
          end: timeOff.endTime,
          backgroundColor: '#ef4444',
          extendedProps: {
            crewMember: crewMember.name,
            type: 'timeoff',
            notes: timeOff.reason || 'Time off'
          }
        });
      }
    });

    return events;
  };

  const events = generateEventsFromData();

  // Event handlers
  const handleEventClick = (eventInfo: any) => {
    setSelectedEvent({
      id: eventInfo.event.id,
      title: eventInfo.event.title,
      start: eventInfo.event.startStr,
      end: eventInfo.event.endStr,
      backgroundColor: eventInfo.event.backgroundColor,
      extendedProps: eventInfo.event.extendedProps
    });
    setIsEditModalOpen(true);
  };

  const handleDateClick = (dateInfo: any) => {
    // Handle clicking on empty time slots
    console.log('Date clicked:', dateInfo);
  };

  const handleEventDrop = (eventInfo: any) => {
    // Handle drag and drop (can be implemented later)
    console.log('Event dropped:', eventInfo);
  };

  // View configuration
  const getCalendarView = () => {
    if (currentView === 'daily') {
      return 'timeGridDay';
    } else {
      return 'timeGridWeek';
    }
  };

  if (isLoadingCrew || isLoadingShows || isLoadingAssignments || isLoadingSchedules || isLoadingTimeOff) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2" />
            Crew Schedule
          </h1>
          <p className="text-gray-500">Manage crew member schedules and assignments</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={currentView === 'daily' ? 'default' : 'outline'}
            onClick={() => setCurrentView('daily')}
            size="sm"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Daily
          </Button>
          <Button
            variant={currentView === 'weekly' ? 'default' : 'outline'}
            onClick={() => setCurrentView('weekly')}
            size="sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            Weekly
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Crew</p>
                <p className="text-2xl font-bold">{(crewMembers as any[]).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Shows</p>
                <p className="text-2xl font-bold">{(shows as any[]).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-2xl font-bold">{(crewAssignments as any[]).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Plus className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Period</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Crew Members Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Crew Members
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {(crewMembers as any[]).map((member: any) => {
                  const memberSchedules = (crewSchedules as any[]).filter(
                    (s: any) => s.crewMemberId === member.id
                  );
                  const memberTimeOff = (crewTimeOff as any[]).filter(
                    (t: any) => t.crewMemberId === member.id
                  );
                  const memberAssignments = (crewAssignments as any[]).filter(
                    (a: any) => a.crewMemberId === member.id
                  );

                  return (
                    <div key={member.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.title}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Schedules:</span>
                          <Badge variant="outline" className="text-xs">
                            {memberSchedules.length}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Assignments:</span>
                          <Badge variant="outline" className="text-xs">
                            {memberAssignments.length}
                          </Badge>
                        </div>
                        {memberTimeOff.length > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Time Off:</span>
                            <Badge variant="destructive" className="text-xs">
                              {memberTimeOff.length}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentView === 'daily' ? 'Daily View' : 'Weekly View'}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Available
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Shows
                  </Badge>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Time Off
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={getCalendarView()}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: ''
                  }}
                  events={events}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  eventDrop={handleEventDrop}
                  editable={true}
                  droppable={true}
                  selectable={true}
                  slotMinTime="06:00:00"
                  slotMaxTime="24:00:00"
                  allDaySlot={false}
                  height="100%"
                  slotDuration="01:00:00"
                  slotLabelInterval="01:00:00"
                  eventMinHeight={30}
                  eventContent={(eventInfo) => (
                    <div className="p-1">
                      <div className="font-medium text-xs">{eventInfo.event.title}</div>
                      <div className="text-xs opacity-75">
                        {eventInfo.event.extendedProps?.show || 
                         eventInfo.event.extendedProps?.type === 'shift' ? 'Available' :
                         eventInfo.event.extendedProps?.type === 'timeoff' ? 'Time Off' : 'Event'}
                      </div>
                    </div>
                  )}
                  viewDidMount={() => {
                    // Update view when calendar mounts
                    if (calendarRef.current) {
                      calendarRef.current.getApi().changeView(getCalendarView());
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Event Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              Edit Schedule Event
            </DialogTitle>
            <DialogDescription>
              Modify shift details or assignment information.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({
                    ...selectedEvent,
                    title: e.target.value
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Time</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={selectedEvent.start?.slice(0, 16)}
                    onChange={(e) => setSelectedEvent({
                      ...selectedEvent,
                      start: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Time</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={selectedEvent.end?.slice(0, 16)}
                    onChange={(e) => setSelectedEvent({
                      ...selectedEvent,
                      end: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="crew-member">Crew Member</Label>
                <Select value={selectedEvent.extendedProps?.crewMember || ''}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(crewMembers as any[]).map((member: any) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name} - {member.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={selectedEvent.extendedProps?.notes || ''}
                  onChange={(e) => setSelectedEvent({
                    ...selectedEvent,
                    extendedProps: {
                      ...selectedEvent.extendedProps,
                      crewMember: selectedEvent.extendedProps?.crewMember || '',
                      type: selectedEvent.extendedProps?.type || 'shift',
                      notes: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle save logic here
              console.log('Saving event:', selectedEvent);
              setIsEditModalOpen(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}