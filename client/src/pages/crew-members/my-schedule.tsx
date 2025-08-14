import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Phone, Mail } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import type { CrewMember, User, Event, EventCrewAssignment } from "@shared/schema";

// Mock current user - in real app, this would come from auth context
const currentUser: User = {
  id: "18658ee4-f93f-4246-9ea6-9aa7a7fc1286",
  email: "test@example.com",
  name: "Test User",
  avatar: null,
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Extended type for event assignments with event details
type EventAssignmentWithDetails = EventCrewAssignment & {
  event: Event;
  crewMember: CrewMember;
};

export default function MySchedule() {
  // Get user's crew member profiles
  const { data: userCrewMembers = [], isLoading: loadingProfiles } = useQuery<CrewMember[]>({
    queryKey: [`/api/users/${currentUser.id}/crew-members`],
  });

  // Get assignments for all user's crew member profiles
  const { data: myAssignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: [`/api/users/${currentUser.id}/assignments`],
    queryFn: async () => {
      // In a real implementation, this would be a dedicated endpoint
      // For now, we'll return mock data based on crew member profiles
      const mockAssignments: EventAssignmentWithDetails[] = [
        {
          id: "assign-1",
          workspaceId: "workspace-1",
          eventId: "event-1",
          crewMemberId: userCrewMembers[0]?.id || "crew-1",
          jobId: "job-1",
          confirmedAt: new Date(),
          notes: "Confirmed assignment",
          createdAt: new Date(),
          event: {
            id: "event-1",
            workspaceId: "workspace-1",
            productionId: "prod-1",
            templateId: "template-1",
            title: "Morning News Show",
            description: "Daily morning news broadcast",
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
            status: "scheduled",
            notes: "",
            color: "#3b82f6",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          crewMember: userCrewMembers[0] || {
            id: "crew-1",
            workspaceId: "workspace-1",
            userId: currentUser.id,
            firstName: "Test",
            lastName: "User",
            email: currentUser.email,
            phone: null,
            primaryJobId: null,
            skills: null,
            hourlyRate: null,
            availability: {},
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
      ];
      return mockAssignments;
    },
    enabled: userCrewMembers.length > 0,
  });

  const getDateBadgeVariant = (date: Date) => {
    if (isToday(date)) return "default";
    if (isTomorrow(date)) return "secondary";
    if (isPast(date)) return "outline";
    return "secondary";
  };

  const getDateBadgeText = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return "Past";
    return format(date, "MMM d");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "in_progress":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loadingProfiles) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading your profile...</div>
      </div>
    );
  }

  if (userCrewMembers.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Crew Member Profile</h3>
              <p className="text-muted-foreground mb-4">
                You need to link your account to a crew member profile to see your schedule.
              </p>
              <Button>
                Link Your Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground">
          Your upcoming assignments and schedule
        </p>
      </div>

      {/* Crew Member Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Profile{userCrewMembers.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {userCrewMembers.map((crewMember: CrewMember) => (
              <Card key={crewMember.id} className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CardContent className="pt-4">
                  <h3 className="font-semibold">
                    {crewMember.firstName} {crewMember.lastName}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground mt-2">
                    {crewMember.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {crewMember.email}
                      </div>
                    )}
                    {crewMember.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {crewMember.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Assignments
          </CardTitle>
          <CardDescription>
            Your scheduled assignments and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAssignments ? (
            <div className="text-center py-4">Loading your schedule...</div>
          ) : myAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming assignments scheduled.</p>
              <p className="text-sm">Check back later or contact your production manager.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myAssignments.map((assignment: EventAssignmentWithDetails) => (
                <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{assignment.event.title}</h3>
                          <Badge variant={getDateBadgeVariant(assignment.event.startTime)}>
                            {getDateBadgeText(assignment.event.startTime)}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(assignment.event.status)}>
                            {assignment.event.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {assignment.event.description && (
                          <p className="text-muted-foreground mb-3">{assignment.event.description}</p>
                        )}

                        <div className="grid gap-2 md:grid-cols-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(assignment.event.startTime, "MMM d, h:mm a")} - 
                              {format(assignment.event.endTime, "h:mm a")}
                            </span>
                          </div>
                          
                          {assignment.confirmedAt && (
                            <div className="flex items-center gap-2 text-green-600">
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Confirmed
                              </Badge>
                            </div>
                          )}
                        </div>

                        {assignment.notes && (
                          <div className="mt-3 p-2 bg-muted rounded-md text-sm">
                            <strong>Notes:</strong> {assignment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}