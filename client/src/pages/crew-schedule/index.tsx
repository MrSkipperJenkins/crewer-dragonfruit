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
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import { cn } from "@/lib/utils";

type ViewType = 'daily' | 'weekly';
type ShiftEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  resourceId?: string;
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
  const [selectedCrewMembers, setSelectedCrewMembers] = useState<string[]>([]);
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

  // Effect to handle crew member selection changes
  useEffect(() => {
    if (calendarRef.current && selectedCrewMembers.length > 0) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(getCalendarView());
    }
  }, [selectedCrewMembers]);

  // Generate events from crew schedules with resource assignment
  const generateEventsFromData = (): ShiftEvent[] => {
    const events: ShiftEvent[] = [];

    // Filter crew schedules based on selected crew members
    const filteredSchedules = selectedCrewMembers.length > 0
      ? (crewSchedules as any[]).filter((schedule: any) => selectedCrewMembers.includes(schedule.crewMemberId))
      : (crewSchedules as any[]);

    // Add regular crew schedules as recurring availability blocks
    filteredSchedules.forEach((schedule: any) => {
      const crewMember = (crewMembers as any[]).find((cm: any) => cm.id === schedule.crewMemberId);
      
      if (crewMember) {
        console.log('Processing schedule for', crewMember.name, ':', {
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime
        });

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
            
            console.log('Raw times from DB:', {
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              parsedStart: startTime,
              parsedEnd: endTime,
              startHours: startTime.getHours(),
              endHours: endTime.getHours()
            });
            
            // Combine date with time - use UTC hours to avoid timezone conversion
            const eventStart = new Date(date);
            eventStart.setHours(startTime.getUTCHours(), startTime.getUTCMinutes(), 0, 0);
            
            const eventEnd = new Date(date);
            eventEnd.setHours(endTime.getUTCHours(), endTime.getUTCMinutes(), 0, 0);
            
            console.log('Final event times:', {
              eventStart: eventStart.toISOString(),
              eventEnd: eventEnd.toISOString()
            });
            
            events.push({
              id: `schedule-${schedule.id}-${date.toISOString().split('T')[0]}`,
              title: `Available`,
              start: eventStart.toISOString(),
              end: eventEnd.toISOString(),
              backgroundColor: '#10b981',
              resourceId: crewMember.id,
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

    return events;
  };

  // Generate resources for the calendar (crew members as columns)
  const generateResources = () => {
    // Only show columns for selected crew members
    const filteredMembers = selectedCrewMembers.length > 0
      ? (crewMembers as any[]).filter((member: any) => selectedCrewMembers.includes(member.id))
      : [];

    return filteredMembers.map((member: any) => ({
      id: member.id,
      title: member.name,
      extendedProps: {
        position: member.title
      }
    }));
  };

  // Toggle crew member selection
  const toggleCrewMember = (memberId: string) => {
    setSelectedCrewMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedCrewMembers([]);
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
    const resources = generateResources();
    if (resources.length >= 1) {
      // Use resource view when any crew members are selected
      return currentView === 'daily' ? 'resourceTimeGridDay' : 'resourceTimeGridWeek';
    } else {
      // Use regular time grid when no crew members selected
      return currentView === 'daily' ? 'timeGridDay' : 'timeGridWeek';
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Crew Members
                </div>
                {selectedCrewMembers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllSelections}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Clear All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedCrewMembers.length === 0 && (crewMembers as any[]).length > 0 && (
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <p className="text-xs text-blue-700 font-medium mb-1">Click crew members to toggle their schedule columns</p>
                  <p className="text-xs text-blue-600">Shows data from crew_schedules table only</p>
                </div>
              )}
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

                  const isSelected = selectedCrewMembers.includes(member.id);
                  
                  return (
                    <div 
                      key={member.id} 
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleCrewMember(member.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-blue-200' : 'bg-blue-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-blue-800' : 'text-blue-700'
                          }`}>
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.title}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="text-blue-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
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
                <div className="flex items-center space-x-3">
                  <span>{currentView === 'daily' ? 'Daily View' : 'Weekly View'}</span>
                  {selectedCrewMembers.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {selectedCrewMembers.length} member{selectedCrewMembers.length > 1 ? 's' : ''} selected
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {selectedCrewMembers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllSelections}
                      className="text-xs"
                    >
                      Clear Selection
                    </Button>
                  )}
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Schedules
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                {selectedCrewMembers.length === 0 ? (
                  <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                    <div className="text-center p-8">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Crew Members Selected</h3>
                      <p className="text-gray-600 mb-4">Select crew members from the sidebar to view their schedules</p>
                      <p className="text-sm text-gray-500">Click on crew member names to toggle their schedule columns</p>
                    </div>
                  </div>
                ) : (
                  <FullCalendar
                    schedulerLicenseKey='CC-Attribution-NonCommercial-NoDerivatives'
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, resourceTimeGridPlugin]}
                    initialView={getCalendarView()}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: ''
                    }}
                    events={events}
                    resources={generateResources()}
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
                    resourceAreaHeaderContent="Crew Members"
                    resourceAreaWidth="200px"
                    resourceLabelContent={(resourceInfo) => (
                      <div className="p-2 text-center">
                        <div className="font-medium text-sm truncate">{resourceInfo.resource.title}</div>
                        <div className="text-xs text-gray-500 truncate">{resourceInfo.resource.extendedProps?.position}</div>
                      </div>
                    )}
                    eventContent={(eventInfo) => (
                      <div className="p-1">
                        <div className="font-medium text-xs">{eventInfo.event.title}</div>
                        <div className="text-xs opacity-75">
                          {eventInfo.event.extendedProps?.type === 'shift' ? 'Available' :
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
                )}
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