import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon 
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  getDay,
  isSameDay,
  addWeeks,
  subWeeks,
  addMonths,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";

const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

export default function CrewSchedulePage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCrewMember, setSelectedCrewMember] = useState<string | null>(null);
  
  // Get dates for the current week
  const weekDates = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 0 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 0 })
  });
  
  // Format week range for display
  const weekRangeText = `${format(weekDates[0], 'MMM d')} - ${format(weekDates[6], 'MMM d, yyyy')}`;
  
  // Fetch crew members
  const { data: crewMembers = [], isLoading: isLoadingCrew } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'crew-members'],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch shows
  const { data: shows = [], isLoading: isLoadingShows } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'shows'],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch crew assignments
  const { data: crewAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'crew-assignments'],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch crew time off
  const { data: crewTimeOffs = [], isLoading: isLoadingTimeOffs } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'crew-time-offs'],
    enabled: !!currentWorkspace?.id,
  });
  
  // Navigation functions
  const goToToday = () => setSelectedDate(new Date());
  const goToPreviousWeek = () => setSelectedDate(subWeeks(selectedDate, 1));
  const goToNextWeek = () => setSelectedDate(addWeeks(selectedDate, 1));
  
  // Function to determine if a crew member has an assignment on a given day and hour
  const getAssignmentForDateHour = (crewMemberId: string, date: Date, hour: number) => {
    if (!crewMemberId) return null;
    
    const assignmentsForCrew = crewAssignments.filter(
      (assignment: any) => assignment.crewMemberId === crewMemberId
    );
    
    for (const assignment of assignmentsForCrew) {
      const show = shows.find((s: any) => s.id === assignment.showId);
      if (!show) continue;
      
      const showStart = parseISO(show.startTime);
      const showEnd = parseISO(show.endTime);
      
      const showStartHour = showStart.getHours();
      const showEndHour = showEnd.getHours();
      
      // Check if show is on this day
      if (isSameDay(date, showStart) && hour >= showStartHour && hour < showEndHour) {
        return { show, assignment };
      }
    }
    
    return null;
  };
  
  // Check if crew member has time off on a given day
  const hasTimeOff = (crewMemberId: string, date: Date) => {
    if (!crewMemberId) return false;
    
    return crewTimeOffs.some((timeOff: any) => {
      if (timeOff.crewMemberId !== crewMemberId) return false;
      
      const timeOffStart = parseISO(timeOff.startTime);
      const timeOffEnd = parseISO(timeOff.endTime);
      
      return date >= timeOffStart && date <= timeOffEnd;
    });
  };
  
  // Determine if a date is in the current month
  const isInCurrentMonth = (date: Date) => {
    const currentMonth = selectedDate.getMonth();
    return date.getMonth() === currentMonth;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-xl">Weekly Schedule</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{weekRangeText}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Time
                    </th>
                    {weekDates.map((date, i) => (
                      <th 
                        key={i}
                        className={cn(
                          "px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider",
                          isSameDay(date, new Date()) && "bg-primary-50 text-primary-700"
                        )}
                      >
                        {format(date, 'EEE')}<br />
                        {format(date, 'MMM d')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hours.map((hour) => (
                    <tr key={hour} className="divide-x divide-gray-200">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 bg-gray-50">
                        {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                      </td>
                      {weekDates.map((date, dayIndex) => {
                        const assignment = selectedCrewMember 
                          ? getAssignmentForDateHour(selectedCrewMember, date, hour)
                          : null;
                        
                        const timeOff = selectedCrewMember 
                          ? hasTimeOff(selectedCrewMember, date)
                          : false;
                        
                        return (
                          <td 
                            key={dayIndex}
                            className={cn(
                              "px-1 py-2 h-14 relative",
                              isSameDay(date, new Date()) && "bg-primary-50/30"
                            )}
                          >
                            {assignment && (
                              <div className="absolute inset-1 rounded-sm p-1 text-xs bg-green-100 border-l-2 border-green-500">
                                <div className="font-medium truncate">{assignment.show.title}</div>
                                <div className="truncate text-gray-500">
                                  {format(parseISO(assignment.show.startTime), 'h:mm a')} - {format(parseISO(assignment.show.endTime), 'h:mm a')}
                                </div>
                              </div>
                            )}
                            
                            {timeOff && !assignment && (
                              <div className="absolute inset-1 rounded-sm p-1 text-xs bg-gray-100 border-l-2 border-gray-500 flex items-center justify-center">
                                Time Off
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-md">Select Crew Member</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Time Off
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Time Off</DialogTitle>
                    <DialogDescription>
                      Submit a time off request for a crew member.
                    </DialogDescription>
                  </DialogHeader>
                  {/* Time off form would go here */}
                  <DialogFooter>
                    <Button>Submit Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {isLoadingCrew ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  crewMembers.map((crewMember: any) => (
                    <div 
                      key={crewMember.id}
                      className={cn(
                        "px-3 py-2 rounded-md cursor-pointer",
                        selectedCrewMember === crewMember.id
                          ? "bg-primary-100 text-primary-800"
                          : "hover:bg-gray-100"
                      )}
                      onClick={() => setSelectedCrewMember(crewMember.id)}
                    >
                      <div className="font-medium">{crewMember.name}</div>
                      <div className="text-sm text-gray-500">{crewMember.title}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-md">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                disabled={(date) => false}
                modifiers={{
                  inRange: (date) => isInCurrentMonth(date),
                }}
                modifiersStyles={{
                  inRange: { fontWeight: 'normal' },
                  outside: { color: '#ccc' },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
