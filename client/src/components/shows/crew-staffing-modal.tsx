import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, UserX, Save, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CrewStaffingModalProps {
  showId: string;
  onClose: () => void;
}

interface JobAssignment {
  jobId: string;
  crewMemberId?: string;
}

export default function CrewStaffingModal({ showId, onClose }: CrewStaffingModalProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch show details
  const { data: show, isLoading: isLoadingShow } = useQuery({
    queryKey: [`/api/shows/${showId}`],
    enabled: !!showId,
  });

  // Fetch required jobs for this show
  const { data: requiredJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: [`/api/shows/${showId}/required-jobs`],
    enabled: !!showId,
  });

  // Fetch current crew assignments for this show
  const { data: crewAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: [`/api/shows/${showId}/crew-assignments`],
    enabled: !!showId,
  });

  // Fetch all crew members
  const { data: crewMembers = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-members`],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch all jobs for job titles
  const { data: jobs = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`],
    enabled: !!currentWorkspace?.id,
  });

  // Initialize assignments when data loads
  useEffect(() => {
    if (requiredJobs.length > 0 && crewAssignments.length >= 0) {
      const initialAssignments: JobAssignment[] = [];
      
      requiredJobs.forEach((job: any) => {
        const quantity = job.quantity || 1;
        for (let i = 0; i < quantity; i++) {
          const existingAssignment = crewAssignments.find(
            (assignment: any) => assignment.jobId === job.jobId && assignment.position === i
          );
          
          initialAssignments.push({
            jobId: job.jobId,
            crewMemberId: existingAssignment?.crewMemberId,
          });
        }
      });
      
      setAssignments(initialAssignments);
    }
  }, [requiredJobs, crewAssignments]);

  // Get job details by ID
  const getJobById = (jobId: string) => {
    return jobs.find((job: any) => job.id === jobId);
  };

  // Get crew member by ID
  const getCrewMemberById = (crewMemberId: string) => {
    return crewMembers.find((member: any) => member.id === crewMemberId);
  };

  // Handle assignment change
  const handleAssignmentChange = (index: number, crewMemberId: string | undefined) => {
    const newAssignments = [...assignments];
    newAssignments[index].crewMemberId = crewMemberId === "unassigned" ? undefined : crewMemberId;
    setAssignments(newAssignments);
    setHasChanges(true);
  };

  // Save assignments mutation
  const saveAssignmentsMutation = useMutation({
    mutationFn: async () => {
      // First, delete all existing assignments for this show
      for (const assignment of crewAssignments) {
        await apiRequest(`/api/crew-assignments/${assignment.id}`, "DELETE");
      }

      // Then create new assignments
      const newAssignments = assignments.filter(a => a.crewMemberId);
      for (const [index, assignment] of newAssignments.entries()) {
        await apiRequest("/api/crew-assignments", "POST", {
          showId,
          crewMemberId: assignment.crewMemberId,
          jobId: assignment.jobId,
          position: index,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/crew-assignments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-assignments`] });
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Crew assignments saved successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save crew assignments",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingShow || isLoadingJobs || isLoadingAssignments;

  // Group assignments by job type for display
  const groupedAssignments = assignments.reduce((groups: any, assignment, index) => {
    const jobId = assignment.jobId;
    if (!groups[jobId]) {
      groups[jobId] = [];
    }
    groups[jobId].push({ ...assignment, index });
    return groups;
  }, {});

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crew Staffing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Crew Staffing - {show?.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {Object.keys(groupedAssignments).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <UserX className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No Job Requirements</h3>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  This show doesn't have any job requirements set up yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedAssignments).map(([jobId, jobAssignments]: [string, any]) => {
              const job = getJobById(jobId);
              const assignedCount = jobAssignments.filter((a: any) => a.crewMemberId).length;
              const totalCount = jobAssignments.length;

              return (
                <Card key={jobId} className="rounded-lg border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <UserCheck className="h-5 w-5" />
                        <span>{job?.title || "Unknown Job"}</span>
                      </CardTitle>
                      <Badge variant={assignedCount === totalCount ? "default" : "secondary"}>
                        {assignedCount} / {totalCount} Assigned
                      </Badge>
                    </div>
                    {job?.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {job.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {jobAssignments.map((assignment: any) => (
                      <div key={assignment.index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Position {jobAssignments.indexOf(assignment) + 1}:
                        </div>
                        <div className="flex-1">
                          <Select
                            value={assignment.crewMemberId || "unassigned"}
                            onValueChange={(value) => handleAssignmentChange(assignment.index, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select crew member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                <span className="text-gray-500">Unassigned</span>
                              </SelectItem>
                              {crewMembers.map((member: any) => (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-sm text-gray-500">({member.title})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {assignment.crewMemberId && (
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {getCrewMemberById(assignment.crewMemberId)?.title}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={() => saveAssignmentsMutation.mutate()}
            disabled={!hasChanges || saveAssignmentsMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveAssignmentsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}