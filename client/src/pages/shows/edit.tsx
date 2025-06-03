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

  const showId = params.id;

  // Fetch show data
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: [`/api/shows/${showId}`],
    enabled: !!showId,
  });

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

  const { data: categories = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-categories`],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch show-specific data
  const { data: requiredJobs = [] } = useQuery({
    queryKey: [`/api/shows/${showId}/required-jobs`],
    enabled: !!showId,
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: [`/api/shows/${showId}/crew-assignments`],
    enabled: !!showId,
  });

  const { data: showResources = [] } = useQuery({
    queryKey: [`/api/shows/${showId}/resources`],
    enabled: !!showId,
  });

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
        workspaceId: show.workspaceId,
      });
    }
  }, [show, form]);

  // Update selected jobs and resources when data loads
  useEffect(() => {
    if (requiredJobs.length > 0) {
      setSelectedJobs(requiredJobs.map((rj: any) => rj.jobId));
    }
  }, [requiredJobs]);

  useEffect(() => {
    if (showResources.length > 0) {
      setSelectedResources(showResources.map((sr: any) => sr.resourceId));
    }
  }, [showResources]);

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

  // Assign crew member mutation
  const assignCrewMutation = useMutation({
    mutationFn: async (data: { crewMemberId: string; jobId: string }) => {
      return apiRequest("POST", "/api/crew-assignments", {
        showId,
        crewMemberId: data.crewMemberId,
        jobId: data.jobId,
        status: "pending",
        workspaceId: currentWorkspace?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/crew-assignments`] });
    },
  });

  // Remove crew assignment mutation
  const removeCrewAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest("DELETE", `/api/crew-assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}/crew-assignments`] });
    },
  });

  const onSubmit = (data: EditShowFormValues) => {
    updateShowMutation.mutate(data);
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

  const handleAssignCrew = (crewMemberId: string, jobId: string) => {
    assignCrewMutation.mutate({ crewMemberId, jobId });
  };

  const handleRemoveCrewAssignment = (assignmentId: string) => {
    removeCrewAssignmentMutation.mutate(assignmentId);
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {/* Required Jobs */}
              <div>
                <h3 className="text-lg font-medium mb-3">Required Jobs</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedJobs.map(jobId => {
                    const job = (jobs as any[]).find(j => j.id === jobId);
                    return job ? (
                      <Badge key={jobId} variant="default" className="flex items-center">
                        {job.title}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-2"
                          onClick={() => handleRemoveJob(jobId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Select onValueChange={handleAddJob}>
                  <SelectTrigger className="w-full md:w-64">
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

              {/* Crew Assignments */}
              <div>
                <h3 className="text-lg font-medium mb-3">Crew Assignments</h3>
                <div className="space-y-4">
                  {selectedJobs.map(jobId => {
                    const job = (jobs as any[]).find(j => j.id === jobId);
                    const assignments = (crewAssignments as any[]).filter(ca => ca.jobId === jobId);
                    
                    return job ? (
                      <div key={jobId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{job.title}</h4>
                          <Select onValueChange={(crewMemberId) => handleAssignCrew(crewMemberId, jobId)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Assign crew member" />
                            </SelectTrigger>
                            <SelectContent>
                              {(crewMembers as any[])
                                .filter(cm => !assignments.some((a: any) => a.crewMemberId === cm.id))
                                .map(crewMember => (
                                  <SelectItem key={crewMember.id} value={crewMember.id}>
                                    {crewMember.name} - {crewMember.title}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          {assignments.map((assignment: any) => {
                            const crewMember = (crewMembers as any[]).find(cm => cm.id === assignment.crewMemberId);
                            return crewMember ? (
                              <div key={assignment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span>{crewMember.name} - {crewMember.title}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCrewAssignment(assignment.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : null;
                          })}
                          {assignments.length === 0 && (
                            <p className="text-gray-500 text-sm">No crew members assigned</p>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })}
                  {selectedJobs.length === 0 && (
                    <p className="text-gray-500">Add required jobs to manage crew assignments</p>
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