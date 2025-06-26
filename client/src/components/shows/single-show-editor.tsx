import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShowSchema } from "@shared/schema";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  X,
  Users,
  Briefcase,
  Monitor,
  Trash2,
  Copy,
} from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";

// Form schema for single show editing
const singleShowSchema = insertShowSchema.extend({
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string(),
  endTime: z.string(),
});

type SingleShowFormValues = z.infer<typeof singleShowSchema>;

interface SingleShowEditorProps {
  show: any;
  onClose: () => void;
  onSave?: (data: any) => void;
}

export function SingleShowEditor({
  show,
  onClose,
  onSave,
}: SingleShowEditorProps) {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [crewAssignments, setCrewAssignments] = useState<any[]>([]);

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

  // Fetch show-specific data
  const { data: requiredJobs = [] } = useQuery({
    queryKey: [`/api/shows/${show?.id}/required-jobs`],
    enabled: !!show?.id,
  });

  const { data: showResources = [] } = useQuery({
    queryKey: [`/api/shows/${show?.id}/resources`],
    enabled: !!show?.id,
  });

  const { data: showCrewAssignments = [] } = useQuery({
    queryKey: [`/api/shows/${show?.id}/crew-assignments`],
    enabled: !!show?.id,
  });

  // Initialize form
  const form = useForm<SingleShowFormValues>({
    resolver: zodResolver(singleShowSchema),
    defaultValues: {
      title: show?.title || "",
      description: show?.description || "",
      startDate: show?.startTime
        ? format(new Date(show.startTime), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      startTime: show?.startTime
        ? format(new Date(show.startTime), "HH:mm")
        : "09:00",
      endDate: show?.endTime
        ? format(new Date(show.endTime), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      endTime: show?.endTime
        ? format(new Date(show.endTime), "HH:mm")
        : "10:00",
      status: show?.status || "scheduled",
      color: show?.color || "#3b82f6",
      notes: show?.notes || "",
      workspaceId: currentWorkspace?.id || "",
      recurringPattern: show?.recurringPattern || null,
      parentId: show?.parentId || null,
      isException: show?.isException || false,
    },
  });

  // Load show-specific data when queries complete
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

  useEffect(() => {
    if (showCrewAssignments.length > 0) {
      setCrewAssignments(showCrewAssignments);
    }
  }, [showCrewAssignments]);

  // Save this show only mutation
  const saveShowMutation = useMutation({
    mutationFn: async (data: SingleShowFormValues) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`);

      const showData = {
        ...data,
        startTime: startDateTime,
        endTime: endDateTime,
        isException: show?.recurringPattern ? true : false,
      };

      return apiRequest(`/api/shows/${show.id}`, {
        method: "PUT",
        body: JSON.stringify(showData),
      });
    },
    onSuccess: (savedShow) => {
      toast({
        title: "Show Updated",
        description: "Changes saved to this show only",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${show.id}`] });
      onSave?.(savedShow);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save show",
        variant: "destructive",
      });
    },
  });

  // Apply to future occurrences mutation
  const applyToFutureMutation = useMutation({
    mutationFn: async (data: SingleShowFormValues) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`);

      // Create a new template starting from this show
      const templateData = {
        ...data,
        startTime: startDateTime,
        endTime: endDateTime,
        recurringPattern: show?.recurringPattern,
        parentId: null, // New series
      };

      return apiRequest("/api/shows", {
        method: "POST",
        body: JSON.stringify(templateData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Applied to Future",
        description: "Changes applied to this and all future occurrences",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply changes to future shows",
        variant: "destructive",
      });
    },
  });

  // Delete this occurrence mutation
  const deleteOccurrenceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/shows/${show.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Show Deleted",
        description: "This show occurrence has been deleted",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete show",
        variant: "destructive",
      });
    },
  });

  // Mutations for managing required jobs
  const addRequiredJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("/api/required-jobs", {
        method: "POST",
        body: JSON.stringify({
          showId: show.id,
          jobId,
          workspaceId: currentWorkspace?.id,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/shows/${show.id}/required-jobs`],
      });
    },
  });

  const removeRequiredJobMutation = useMutation({
    mutationFn: async (requiredJobId: string) => {
      return apiRequest(`/api/required-jobs/${requiredJobId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/shows/${show.id}/required-jobs`],
      });
    },
  });

  // Mutations for managing resources
  const addShowResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      return apiRequest("/api/show-resources", {
        method: "POST",
        body: JSON.stringify({
          showId: show.id,
          resourceId,
          workspaceId: currentWorkspace?.id,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/shows/${show.id}/resources`],
      });
    },
  });

  const removeShowResourceMutation = useMutation({
    mutationFn: async (showResourceId: string) => {
      return apiRequest(`/api/show-resources/${showResourceId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/shows/${show.id}/resources`],
      });
    },
  });

  const onSubmit = (data: SingleShowFormValues) => {
    saveShowMutation.mutate(data);
  };

  const handleApplyToFuture = () => {
    const data = form.getValues();
    applyToFutureMutation.mutate(data);
  };

  const handleDeleteOccurrence = () => {
    deleteOccurrenceMutation.mutate();
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
      setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
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
    const showResource = showResources.find(
      (sr: any) => sr.resourceId === resourceId,
    );
    if (showResource) {
      setSelectedResources(selectedResources.filter((id) => id !== resourceId));
      removeShowResourceMutation.mutate(showResource.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit This Show
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Changes here will only apply to this date
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Show Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter show title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter show description"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
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
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <ColorPicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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
              </CardContent>
            </Card>
          </div>

          {/* Required Jobs for This Show */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Required Jobs for This Show
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedJobs.map((jobId) => {
                    const job = jobs.find((j: any) => j.id === jobId);
                    return job ? (
                      <Badge
                        key={jobId}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {job.title}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveJob(jobId)}
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Select onValueChange={handleAddJob}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add required job..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs
                      .filter((job: any) => !selectedJobs.includes(job.id))
                      .map((job: any) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resources for This Show */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Resources for This Show
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedResources.map((resourceId) => {
                    const resource = resources.find(
                      (r: any) => r.id === resourceId,
                    );
                    return resource ? (
                      <Badge
                        key={resourceId}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {resource.name}
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveResource(resourceId)}
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Select onValueChange={handleAddResource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add resource..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resources
                      .filter(
                        (resource: any) =>
                          !selectedResources.includes(resource.id),
                      )
                      .map((resource: any) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.name} ({resource.type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Crew Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Crew Assignments for This Show
              </CardTitle>
            </CardHeader>
            <CardContent>
              {crewAssignments.length > 0 ? (
                <div className="space-y-2">
                  {crewAssignments.map((assignment: any) => {
                    const crewMember = crewMembers.find(
                      (cm: any) => cm.id === assignment.crewMemberId,
                    );
                    const job = jobs.find(
                      (j: any) => j.id === assignment.jobId,
                    );

                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{crewMember?.name}</p>
                            <p className="text-sm text-gray-600">
                              {job?.title}
                            </p>
                          </div>
                          <Badge
                            variant={
                              assignment.status === "confirmed"
                                ? "default"
                                : assignment.status === "declined"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No crew assignments yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes specific to this show..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saveShowMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saveShowMutation.isPending ? "Saving..." : "Save This Only"}
              </Button>

              {show?.recurringPattern && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyToFuture}
                  disabled={applyToFutureMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {applyToFutureMutation.isPending
                    ? "Applying..."
                    : "Apply to Future"}
                </Button>
              )}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete This Occurrence
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Show Occurrence</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete only this specific show occurrence. Other
                    shows in the series will not be affected. This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Show</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteOccurrence}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleteOccurrenceMutation.isPending}
                  >
                    {deleteOccurrenceMutation.isPending
                      ? "Deleting..."
                      : "Delete This Occurrence"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </Form>
    </div>
  );
}
