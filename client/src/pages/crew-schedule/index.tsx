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

  // Generate events from real crew assignments and shows
  const generateEventsFromData = (): ShiftEvent[] => {
    const events: ShiftEvent[] = [];

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

  if (isLoadingCrew || isLoadingShows || isLoadingAssignments) {
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

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentView === 'daily' ? 'Daily View' : 'Weekly View'}</span>
            <Badge variant="outline">
              {(crewMembers as any[]).length} crew members
            </Badge>
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
                    {eventInfo.event.extendedProps?.show || 'Shift'}
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