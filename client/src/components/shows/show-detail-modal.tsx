import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, X } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedShow, setEditedShow] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    status: '',
    notes: ''
  });
  
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
    queryKey: [`/api/workspaces/${(show as any)?.workspaceId}/resources`],
    enabled: !!(show as any)?.workspaceId,
  });

  // Fetch all crew members to get their details
  const { data: crewMembers = [] } = useQuery({
    queryKey: [`/api/workspaces/${(show as any)?.workspaceId}/crew-members`],
    enabled: !!(show as any)?.workspaceId,
  });
  
  // Fetch all jobs to get their details
  const { data: jobs = [] } = useQuery({
    queryKey: [`/api/workspaces/${(show as any)?.workspaceId}/jobs`],
    enabled: !!(show as any)?.workspaceId,
  });
  
  // Set initial form data from show data
  useEffect(() => {
    if (show) {
      setEditedShow({
        title: (show as any).title || '',
        description: (show as any).description || '',
        startTime: (show as any).startTime || '',
        endTime: (show as any).endTime || '',
        status: (show as any).status || '',
        notes: (show as any).notes || ''
      });
    }
  }, [show]);
  
  // Update show mutation
  const updateShowMutation = useMutation({
    mutationFn: async (updatedShow: any) => {
      return apiRequest("PUT", `/api/shows/${showId}`, updatedShow);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Show updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${(show as any)?.workspaceId}/shows`] });
      setIsEditing(false);
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
    return (allResources as any[]).find((r: any) => r.id === resourceId);
  };
  
  // Get crew member by id
  const getCrewMember = (crewMemberId: string) => {
    return (crewMembers as any[]).find((c: any) => c.id === crewMemberId);
  };
  
  // Get job by id
  const getJob = (jobId: string) => {
    return (jobs as any[]).find((j: any) => j.id === jobId);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    updateShowMutation.mutate(editedShow);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (show) {
      setEditedShow({
        title: (show as any).title || '',
        description: (show as any).description || '',
        startTime: (show as any).startTime || '',
        endTime: (show as any).endTime || '',
        status: (show as any).status || '',
        notes: (show as any).notes || ''
      });
    }
  };

  // Format datetime for input fields with error handling
  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return '';
    }
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <DialogHeader className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Show' : (show as any)?.title || 'Show Details'}
              </DialogTitle>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={editedShow.status} 
                          onValueChange={(value) => setEditedShow(prev => ({...prev, status: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={editedShow.title}
                          onChange={(e) => setEditedShow(prev => ({...prev, title: e.target.value}))}
                          placeholder="Show title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editedShow.description}
                          onChange={(e) => setEditedShow(prev => ({...prev, description: e.target.value}))}
                          placeholder="Show description"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Badge 
                        className={getStatusColor((show as any)?.status)}
                        variant="secondary"
                      >
                        {(show as any)?.status === 'scheduled' ? 'Active' : (show as any)?.status}
                      </Badge>
                      <h2 className="text-xl font-semibold text-gray-900 mt-2">{(show as any)?.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">{(show as any)?.description}</p>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                  className="ml-4"
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                </Button>
              </div>
            </DialogHeader>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formatDateTimeForInput(editedShow.startTime)}
                      onChange={(e) => setEditedShow(prev => ({...prev, startTime: e.target.value ? new Date(e.target.value).toISOString() : ''}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formatDateTimeForInput(editedShow.endTime)}
                      onChange={(e) => setEditedShow(prev => ({...prev, endTime: e.target.value ? new Date(e.target.value).toISOString() : ''}))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-500">Schedule</div>
                    <div className="font-medium">
                      {(show as any)?.recurringPattern?.includes("WEEKLY") 
                        ? `Weekdays, ${formatTime((show as any)?.startTime)} - ${formatTime((show as any)?.endTime)}`
                        : `${formatDateTime((show as any)?.startTime)} - ${formatDateTime((show as any)?.endTime)}`}
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
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Resources</h3>
                <div className="bg-gray-50 rounded-md divide-y divide-gray-200 max-h-48 overflow-y-auto">
                  {(showResources as any[]).length > 0 ? (showResources as any[]).map((sr: any) => {
                    const resource = getResource(sr.resourceId);
                    return (
                      <div key={sr.id} className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{resource?.name || 'Unknown Resource'}</div>
                          <div className="text-sm text-gray-500">{resource?.type}</div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          Confirmed
                        </Badge>
                      </div>
                    );
                  }) : (
                    <div className="p-4 text-center text-gray-500">
                      No resources assigned to this show
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Crew Members</h3>
                  <Button variant="link" size="sm" className="text-primary-600 font-medium">
                    Manage Crew
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
                  {(crewAssignments as any[]).length > 0 ? (crewAssignments as any[]).map((assignment: any) => {
                    const crewMember = getCrewMember(assignment.crewMemberId);
                    const job = getJob(assignment.jobId);
                    return (
                      <div key={assignment.id} className="p-4 flex items-center space-x-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(crewMember?.name || '')}&background=random`} />
                          <AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(crewMember?.name || 'UN')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{crewMember?.name || 'Unknown Member'}</div>
                          <div className="text-sm text-gray-500">{job?.title || 'Unknown Role'}</div>
                        </div>
                        <Badge 
                          variant="secondary"
                          className={
                            assignment.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : assignment.status === 'pending' 
                              ? 'bg-amber-100 text-amber-800 border-amber-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {assignment.status === 'confirmed' ? 'Confirmed' : 
                           assignment.status === 'pending' ? 'Unconfirmed' : 'Declined'}
                        </Badge>
                      </div>
                    );
                  }) : null}
                  
                  {requiredJobs
                    .filter((requiredJob: any) => {
                      // Find jobs that don't have assignments
                      return !crewAssignments.some((ca: any) => ca.jobId === requiredJob.jobId);
                    })
                    .map((requiredJob: any) => {
                      const job = getJob(requiredJob.jobId);
                      return (
                        <div key={requiredJob.id} className="p-4 flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-500 text-lg font-light">+</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-red-600">{job?.title || 'Unknown Position'}</div>
                            <div className="text-sm text-red-500">Unfilled Position</div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          >
                            Assign
                          </Button>
                        </div>
                      );
                    })}
                    
                  {crewAssignments.length === 0 && requiredJobs.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No crew assignments for this show
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                <Textarea 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  placeholder="Add show notes here..."
                  value={editedShow.notes}
                  onChange={(e) => setEditedShow(prev => ({...prev, notes: e.target.value}))}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <DialogFooter className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={updateShowMutation.isPending}>
                    {updateShowMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ShowDetailModal;
