import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShowSchema, insertRequiredJobSchema, insertCrewAssignmentSchema } from "@shared/schema";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Trash2, 
  ArrowLeft, 
  Plus, 
  X,
  Users,
  Briefcase,
  Monitor
} from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";

// Form schema for editing shows
const editShowSchema = insertShowSchema.extend({
  id: z.string().uuid(),
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string(),
  endTime: z.string(),
});

type EditShowFormValues = z.infer<typeof editShowSchema>;

export default function EditShow() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [localCrewAssignments, setLocalCrewAssignments] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const showId = params.id;

  // Fetch show data
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: [`/api/shows/${showId}`],
    enabled: !!showId,
  }) as { data: any, isLoading: boolean };

  // Fetch workspace data
  const { data: jobs = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`],
    enabled: !!currentWorkspace?.id,
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-members`],
    enabled: !!currentWorkspace?.id,
  });

  const { data: resources = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/resources`],
    enabled: !!currentWorkspace?.id,
  });

  // Labels are now handled directly in show data - no separate API calls needed
  const SUGGESTED_LABELS = ["News", "Drama", "Documentary", "Taper", "External Hit", "Rehearsal"];

  // Fetch show-specific data
  const { data: requiredJobs = [] } = useQuery({
    queryKey: [`/api/shows/${showId}/required-jobs`],
    enabled: !!showId,
  }) as { data: any[] };

  const { data: crewAssignments = [] } = useQuery({
    queryKey: [`/api/shows/${showId}/crew-assignments`],
    enabled: !!showId,
  }) as { data: any[] };

  const { data: showResources = [] } = useQuery({
    queryKey: [`/api/shows/${showId}/resources`],
    enabled: !!showId,
  }) as { data: any[] };

  // Initialize form
  const form = useForm<EditShowFormValues>({
    resolver: zodResolver(editShowSchema),
    defaultValues: {
      id: "",
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      status: "draft",
      color: "#2094f3",
      workspaceId: currentWorkspace?.id || "",
    },
  });

  // Update form when show data loads
  useEffect(() => {
    if (show) {
      const startDate = new Date(show.startTime);
      const endDate = new Date(show.endTime);
      
      form.reset({
        id: show.id,
        title: show.title,
        description: show.description || "",
        startDate: format(startDate, "yyyy-MM-dd"),
        startTime: format(startDate, "HH:mm"),
        endDate: format(endDate, "yyyy-MM-dd"),
        endTime: format(endDate, "HH:mm"),
        status: show.status,
        color: show.color || "#2094f3",
        label: show.label || "",
        workspaceId: show.workspaceId,
      });
    }
  }, [show, form]);

  // Labels are now handled directly in the show data - no separate initialization needed

  // Update selected jobs and resources when data loads
  useEffect(() => {
    if (requiredJobs.length > 0) {
      // Use Set to ensure unique job IDs only
      const jobIds = requiredJobs.map((rj: any) => rj.jobId);
      const uniqueJobIds = jobIds.filter((id, index) => jobIds.indexOf(id) === index);
      setSelectedJobs(uniqueJobIds);
    }
  }, [requiredJobs]);

  useEffect(() => {
    if (showResources.length > 0) {
      setSelectedResources(showResources.map((sr: any) => sr.resourceId));
    }
  }, [showResources]);

  // Initialize local crew assignments when data loads
  useEffect(() => {
    if (crewAssignments.length > 0) {
      setLocalCrewAssignments([...crewAssignments]);
    }
  }, [crewAssignments]);

  // Update show mutation
  const updateShowMutation = useMutation({
    mutationFn: async (data: EditShowFormValues) => {
      const { startDate, startTime, endDate, endTime, ...showData } = data;
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      return apiRequest("PUT", `/api/shows/${showId}`, {
        ...showData,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Show updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update show",
        variant: "destructive",
      });
    },
  });

  // Delete show mutation
  const deleteShowMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/shows/${showId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Show deleted successfully",
      });
      navigate("/shows/list");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete show",
        variant: "destructive",
      });
    },
  });

  // Add required job mutation
  const addRequiredJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", "/api/required-jobs", {
        showId,
        jobId,
        workspaceId: currentWorkspace?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/required-jobs`] });
      // Invalidate shows list and staffing data
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`] });
      queryClient.invalidateQueries({ queryKey: [`/api/crew-assignments-batch`] });
      queryClient.invalidateQueries({ queryKey: [`/api/required-jobs-batch`] });
    },
  });

  // Remove required job mutation
  const removeRequiredJobMutation = useMutation({
    mutationFn: async (requiredJobId: string) => {
      return apiRequest("DELETE", `/api/required-jobs/${requiredJobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/required-jobs`] });
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/crew-assignments`] });
      // Invalidate shows list and staffing data
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`] });
      queryClient.invalidateQueries({ queryKey: [`/api/crew-assignments-batch`] });
      queryClient.invalidateQueries({ queryKey: [`/api/required-jobs-batch`] });
    },
  });

  // Add show resource mutation
  const addShowResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      return apiRequest("POST", "/api/show-resources", {
        showId,
        resourceId,
        workspaceId: currentWorkspace?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/resources`] });
    },
  });

  // Remove show resource mutation
  const removeShowResourceMutation = useMutation({
    mutationFn: async (showResourceId: string) => {
      return apiRequest("DELETE", `/api/show-resources/${showResourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/resources`] });
    },
  });

  // Local crew assignment handlers (no API calls until save)
  const handleLocalAssignCrew = (crewMemberId: string, requiredJobId: string) => {
    const requiredJob = requiredJobs.find((rj: any) => rj.id === requiredJobId);
    if (!requiredJob) return;

    // Remove existing assignment for this required job if it exists
    const updatedAssignments = localCrewAssignments.filter(ca => ca.requiredJobId !== requiredJobId);
    
    // Add new assignment
    const newAssignment = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      showId,
      crewMemberId,
      jobId: requiredJob.jobId,
      requiredJobId,
      status: "pending",
      workspaceId: currentWorkspace?.id,
      isLocal: true // Flag to identify local changes
    };
    
    setLocalCrewAssignments([...updatedAssignments, newAssignment]);
    setHasUnsavedChanges(true);
  };

  const handleLocalRemoveCrewAssignment = (requiredJobId: string) => {
    const updatedAssignments = localCrewAssignments.filter(ca => ca.requiredJobId !== requiredJobId);
    setLocalCrewAssignments(updatedAssignments);
    setHasUnsavedChanges(true);
  };

  const handleLocalUpdateAssignmentStatus = (requiredJobId: string, status: string) => {
    setLocalCrewAssignments(prev => 
      prev.map(ca => 
        ca.requiredJobId === requiredJobId 
          ? { ...ca, status } 
          : ca
      )
    );
    setHasUnsavedChanges(true);
  };

  // Labels are now handled directly through the form - no separate handler needed

  const onSubmit = async (data: EditShowFormValues) => {
    try {
      // First update the show details
      await updateShowMutation.mutateAsync(data);
      
      // Save crew assignment changes if any
      if (hasUnsavedChanges) {
        await saveCrewAssignmentChanges();
      }
      
      // Invalidate shows list and related queries
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${show?.workspaceId}/shows`] });
      queryClient.invalidateQueries({ queryKey: [`/api/crew-assignments-batch`] });
      queryClient.invalidateQueries({ queryKey: [`/api/required-jobs-batch`] });
      
      // Also invalidate the show data to refresh display
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}`] });
      
      toast({
        title: "Success",
        description: "Show updated successfully",
      });
      
      // Navigate back to the list view after successful save
      navigate("/shows/list");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update show",
        variant: "destructive",
      });
    }
  };

  // Labels are now handled directly in show data - no separate save functions needed

  const saveCrewAssignmentChanges = async () => {
    try {
      // Use a batch API call to handle the atomic replacement of all assignments
      await apiRequest("PUT", `/api/shows/${showId}/crew-assignments`, {
        assignments: localCrewAssignments.map(assignment => ({
          crewMemberId: assignment.crewMemberId,
          jobId: assignment.jobId,
          requiredJobId: assignment.requiredJobId,
          status: assignment.status,
          workspaceId: assignment.workspaceId,
        }))
      });

      // Refresh crew assignments data and shows list
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/crew-assignments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`] });
      queryClient.invalidateQueries({ queryKey: [`/api/crew-assignments-batch`] });
      
      setHasUnsavedChanges(false);
      
      toast({
        title: "Success",
        description: "Crew assignments saved successfully",
      });
    } catch (error) {
      console.error("Save crew assignments error:", error);
      toast({
        title: "Error",
        description: "Failed to save crew assignments",
        variant: "destructive",
      });
    }
  };

  const handleAddJob = (jobId: string) => {
    if (!selectedJobs.includes(jobId)) {
      setSelectedJobs([...selectedJobs, jobId]);
      addRequiredJobMutation.mutate(jobId);
    }
  };

  const handleRemoveJob = (jobId: string) => {
    const requiredJob = requiredJobs.find((rj: any) => rj.jobId === jobId);
    if (requiredJob) {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
      removeRequiredJobMutation.mutate(requiredJob.id);
    }
  };

  const handleRemoveRequiredJob = (requiredJobId: string) => {
    removeRequiredJobMutation.mutate(requiredJobId);
  };

  const handleAddResource = (resourceId: string) => {
    if (!selectedResources.includes(resourceId)) {
      setSelectedResources([...selectedResources, resourceId]);
      addShowResourceMutation.mutate(resourceId);
    }
  };

  const handleRemoveResource = (resourceId: string) => {
    const showResource = showResources.find((sr: any) => sr.resourceId === resourceId);
    if (showResource) {
      setSelectedResources(selectedResources.filter(id => id !== resourceId));
      removeShowResourceMutation.mutate(showResource.id);
    }
  };

  // These handlers are replaced by local handlers above

  if (showLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Show not found</h2>
        <Button onClick={() => navigate("/shows/list")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shows
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/shows/list")}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shows
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Show</h1>
            <p className="text-gray-500">Update show details, crew assignments, and resources</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateShowMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateShowMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Show
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Show</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{show.title}"? This action cannot be undone and will remove all associated crew assignments and resources.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteShowMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Show
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Show title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a label (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Label</SelectItem>
                          {SUGGESTED_LABELS.map(label => (
                            <SelectItem key={label} value={label}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a label to categorize your show
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Show description" 
                        className="resize-none" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value || "#2094f3"}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose a color to help identify this event in the calendar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Required Jobs & Crew Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Crew Staffing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Required Jobs & Crew Assignments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Required Jobs & Crew Assignments</h3>
                  <div className="flex items-center gap-3">
                    {hasUnsavedChanges && (
                      <Button
                        onClick={saveCrewAssignmentChanges}
                        disabled={!hasUnsavedChanges}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    )}
                    <Select onValueChange={handleAddJob}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Add required job" />
                      </SelectTrigger>
                      <SelectContent>
                        {(jobs as any[])
                          .filter(job => !selectedJobs.includes(job.id))
                          .map(job => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {hasUnsavedChanges && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">You have unsaved crew assignment changes. Click Save Changes to apply them.</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  {requiredJobs.map((requiredJob: any) => {
                    const job = (jobs as any[]).find(j => j.id === requiredJob.jobId);
                    const assignment = localCrewAssignments.find(ca => ca.requiredJobId === requiredJob.id);
                    const assignedCrewMember = assignment ? (crewMembers as any[]).find(cm => cm.id === assignment.crewMemberId) : null;
                    
                    return job ? (
                      <div key={`required-job-${requiredJob.id}`} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge variant="outline" className="text-sm">
                                {job.title}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1 text-gray-400 hover:text-red-600"
                                onClick={() => handleRemoveRequiredJob(requiredJob.id)}
                                title="Remove required job"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {requiredJob.notes && (
                              <p className="text-sm text-gray-600 mb-3">{requiredJob.notes}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                {assignment && assignedCrewMember ? (
                                  <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-medium text-blue-700">
                                            {assignedCrewMember.name.split(' ').map((n: string) => n[0]).join('')}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{assignedCrewMember.name}</p>
                                          <p className="text-xs text-gray-600">{assignedCrewMember.title}</p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleLocalRemoveCrewAssignment(requiredJob.id)}
                                        className="text-gray-400 hover:text-red-600"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <label className="text-sm font-medium text-gray-700">Status:</label>
                                      <Select 
                                        value={assignment.status} 
                                        onValueChange={(status) => handleLocalUpdateAssignmentStatus(requiredJob.id, status)}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                              Pending
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="confirmed">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                              Confirmed
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="declined">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                              Declined
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ) : (
                                  <Select onValueChange={(crewMemberId) => handleLocalAssignCrew(crewMemberId, requiredJob.id)}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Assign crew member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(crewMembers as any[])
                                        .filter(crewMember => {
                                          // Filter out crew members already assigned to other jobs in this show
                                          const isAlreadyAssigned = localCrewAssignments.some(ca => 
                                            ca.crewMemberId === crewMember.id && ca.requiredJobId !== requiredJob.id
                                          );
                                          return !isAlreadyAssigned;
                                        })
                                        .map(crewMember => (
                                        <SelectItem key={`req-${requiredJob.id}-crew-${crewMember.id}`} value={crewMember.id}>
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                              <span className="text-xs font-medium text-blue-700">
                                                {crewMember.name.split(' ').map((n: string) => n[0]).join('')}
                                              </span>
                                            </div>
                                            <span>{crewMember.name} - {crewMember.title}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                  {requiredJobs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No required jobs added yet</p>
                      <p className="text-sm">Add jobs above to manage crew assignments</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedResources.map(resourceId => {
                  const resource = (resources as any[]).find(r => r.id === resourceId);
                  return resource ? (
                    <Badge key={resourceId} variant="secondary" className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: resource.color || "#2094f3" }}
                      />
                      {resource.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-2"
                        onClick={() => handleRemoveResource(resourceId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ) : null;
                })}
              </div>
              <Select onValueChange={handleAddResource}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Add resource" />
                </SelectTrigger>
                <SelectContent>
                  {(resources as any[])
                    .filter(resource => !selectedResources.includes(resource.id))
                    .map(resource => (
                      <SelectItem key={resource.id} value={resource.id}>
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: resource.color || "#2094f3" }}
                          />
                          {resource.name} ({resource.type})
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}