import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDateTime, getStatusColor, formatTime } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type ShowDetailModalProps = {
  showId: string;
  onClose: () => void;
};

export function ShowDetailModal({ showId, onClose }: ShowDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  
  // Fetch show details
  const { data: show, isLoading: isLoadingShow } = useQuery({
    queryKey: [`/api/shows/${showId}`],
    enabled: !!showId,
  });
  
  // Fetch resources assigned to this show
  const { data: showResources = [], isLoading: isLoadingResources } = useQuery({
    queryKey: [`/api/shows/${showId}/resources`],
    enabled: !!showId,
  });
  
  // Fetch crew assignments for this show
  const { data: crewAssignments = [], isLoading: isLoadingCrew } = useQuery({
    queryKey: [`/api/shows/${showId}/crew-assignments`],
    enabled: !!showId,
  });
  
  // Fetch required jobs for this show
  const { data: requiredJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: [`/api/shows/${showId}/required-jobs`],
    enabled: !!showId,
  });
  
  // Fetch all resources to get their details
  const { data: allResources = [] } = useQuery({
    queryKey: ['/api/workspaces', show?.workspaceId, 'resources'],
    enabled: !!show?.workspaceId,
  });

  // Fetch all crew members to get their details
  const { data: crewMembers = [] } = useQuery({
    queryKey: ['/api/workspaces', show?.workspaceId, 'crew-members'],
    enabled: !!show?.workspaceId,
  });
  
  // Fetch all jobs to get their details
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/workspaces', show?.workspaceId, 'jobs'],
    enabled: !!show?.workspaceId,
  });
  
  // Set initial notes from show data
  useEffect(() => {
    if (show?.notes) {
      setNotes(show.notes);
    }
  }, [show]);
  
  // Update show mutation
  const updateShowMutation = useMutation({
    mutationFn: async (updatedShow: { notes: string }) => {
      return apiRequest("PUT", `/api/shows/${showId}`, updatedShow);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Show updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}`] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update show",
        variant: "destructive",
      });
    },
  });
  
  // Get resource by id
  const getResource = (resourceId: string) => {
    return allResources.find((r: any) => r.id === resourceId);
  };
  
  // Get crew member by id
  const getCrewMember = (crewMemberId: string) => {
    return crewMembers.find((c: any) => c.id === crewMemberId);
  };
  
  // Get job by id
  const getJob = (jobId: string) => {
    return jobs.find((j: any) => j.id === jobId);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    updateShowMutation.mutate({ notes });
  };
  
  // Format crew name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const isLoading = isLoadingShow || isLoadingResources || isLoadingCrew || isLoadingJobs;
  
  return (
    <Dialog open={!!showId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <DialogHeader className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <Badge 
                  className={getStatusColor(show?.status)}
                  variant="secondary"
                >
                  {show?.status === 'scheduled' ? 'Active' : show?.status}
                </Badge>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">{show?.title}</h2>
                <p className="text-sm text-gray-500">{show?.description}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogHeader>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Schedule</div>
                  <div className="font-medium">
                    {show?.recurringPattern?.includes("WEEKLY") 
                      ? `Weekdays, ${formatTime(show?.startTime)} - ${formatTime(show?.endTime)}`
                      : `${formatDateTime(show?.startTime)} - ${formatDateTime(show?.endTime)}`}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-medium">News</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-medium text-green-600">Fully Staffed</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Resources</h3>
                <div className="bg-gray-50 rounded-md p-4 space-y-2">
                  {showResources.map((sr: any) => {
                    const resource = getResource(sr.resourceId);
                    return (
                      <div key={sr.id} className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div>
                          <div className="font-medium">{resource?.name}</div>
                          <div className="text-sm text-gray-500">{resource?.description || resource?.type}</div>
                        </div>
                        <Badge variant="success">
                          Confirmed
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Crew Members</h3>
                  <Button variant="link" size="sm" className="text-primary-600 font-medium">
                    Manage Crew
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-md divide-y divide-gray-200">
                  {crewAssignments.map((assignment: any) => {
                    const crewMember = getCrewMember(assignment.crewMemberId);
                    const job = getJob(assignment.jobId);
                    return (
                      <div key={assignment.id} className="p-3 flex items-center">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(crewMember?.name || '')}&background=random`} />
                          <AvatarFallback>{getInitials(crewMember?.name || '')}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <div className="font-medium">{crewMember?.name}</div>
                          <div className="text-sm text-gray-500">{job?.title}</div>
                        </div>
                        <Badge 
                          className="ml-auto"
                          variant={assignment.status === 'confirmed' ? 'success' : 
                                 assignment.status === 'pending' ? 'warning' : 'destructive'}
                        >
                          {assignment.status === 'confirmed' ? 'Confirmed' : 
                           assignment.status === 'pending' ? 'Unconfirmed' : 'Declined'}
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {requiredJobs
                    .filter((requiredJob: any) => {
                      // Find jobs that don't have assignments
                      return !crewAssignments.some((ca: any) => ca.jobId === requiredJob.jobId);
                    })
                    .map((requiredJob: any) => {
                      const job = getJob(requiredJob.jobId);
                      return (
                        <div key={requiredJob.id} className="p-3 flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-lg">+</span>
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-500">{job?.title}</div>
                            <div className="text-sm text-red-500">Unfilled Position</div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-auto bg-primary-100 text-primary-800 border-primary-200 hover:bg-primary-200"
                          >
                            Assign
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                <Textarea 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  placeholder="Add show notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter className="p-4 sm:p-6 border-t border-gray-200">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={updateShowMutation.isPending}>
                {updateShowMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ShowDetailModal;
