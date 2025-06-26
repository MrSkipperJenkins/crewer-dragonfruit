import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertShowSchema,
  Show,
  Job,
  Resource,
  CrewMember,
} from "@shared/schema";
import { format } from "date-fns";
import { RRule } from "rrule";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Save,
  Calendar,
  X,
  Plus,
  Users,
  Briefcase,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";

// Form schema for show templates
const showTemplateSchema = insertShowSchema.extend({
  startDate: z.string(),
  startTime: z.string(),
  duration: z.number().min(15).max(1440), // 15 minutes to 24 hours
  frequency: z.enum(["daily", "weekly", "monthly"]),
  weekdays: z.array(z.number()).optional(),
  monthlyType: z.enum(["date", "weekday"]).optional(),
  endType: z.enum(["never", "date", "count"]),
  endDate: z.string().optional(),
  endCount: z.number().optional(),
});

type ShowTemplateFormValues = z.infer<typeof showTemplateSchema>;

interface ShowTemplateEditorProps {
  show?: any;
  onClose: () => void;
  onSave?: (data: any) => void;
}

export function ShowTemplateEditor({
  show,
  onClose,
  onSave,
}: ShowTemplateEditorProps) {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedCrewAssignments, setSelectedCrewAssignments] = useState<any[]>(
    [],
  );

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

  // Initialize form
  const form = useForm<ShowTemplateFormValues>({
    resolver: zodResolver(showTemplateSchema),
    defaultValues: {
      title: show?.title || "",
      description: show?.description || "",
      startDate: show?.startTime
        ? format(new Date(show.startTime), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      startTime: show?.startTime
        ? format(new Date(show.startTime), "HH:mm")
        : "09:00",
      duration: show
        ? Math.floor(
            (new Date(show.endTime).getTime() -
              new Date(show.startTime).getTime()) /
              (1000 * 60),
          )
        : 60,
      frequency: "weekly",
      weekdays: [1], // Monday
      endType: "never",
      status: show?.status || "scheduled",
      color: show?.color || "#3b82f6",
      notes: show?.notes || "",
      workspaceId: currentWorkspace?.id || "",
    },
  });

  // Parse existing recurring pattern if editing
  useEffect(() => {
    if (show?.recurringPattern && show.recurringPattern !== "null") {
      try {
        const rule = RRule.fromString(show.recurringPattern);
        const options = rule.options;

        form.setValue(
          "frequency",
          options.freq === RRule.DAILY
            ? "daily"
            : options.freq === RRule.WEEKLY
              ? "weekly"
              : "monthly",
        );

        if (options.byweekday) {
          const weekdays = Array.isArray(options.byweekday)
            ? options.byweekday.map((day: any) =>
                typeof day === "number" ? day : (day as any).weekday,
              )
            : [
                typeof options.byweekday === "number"
                  ? options.byweekday
                  : (options.byweekday as any).weekday,
              ];
          form.setValue("weekdays", weekdays);
        }

        if (options.until) {
          form.setValue("endType", "date");
          form.setValue("endDate", format(options.until, "yyyy-MM-dd"));
        } else if (options.count) {
          form.setValue("endType", "count");
          form.setValue("endCount", options.count);
        }
      } catch (error) {
        console.warn(
          "Could not parse recurring pattern:",
          show.recurringPattern,
        );
      }
    }
  }, [show, form]);

  // Load existing required jobs, crew assignments, and resources
  useEffect(() => {
    if (show?.id) {
      // Load required jobs
      fetch(`/api/shows/${show.id}/required-jobs`)
        .then((res) => res.json())
        .then((data) => setSelectedJobs(data.map((rj: any) => rj.jobId)))
        .catch(console.error);

      // Load resources
      fetch(`/api/shows/${show.id}/resources`)
        .then((res) => res.json())
        .then((data) =>
          setSelectedResources(data.map((sr: any) => sr.resourceId)),
        )
        .catch(console.error);

      // Load crew assignments
      fetch(`/api/shows/${show.id}/crew-assignments`)
        .then((res) => res.json())
        .then((data) => setSelectedCrewAssignments(data))
        .catch(console.error);
    }
  }, [show?.id]);

  // Create recurring pattern string
  const createRecurringPattern = (data: ShowTemplateFormValues): string => {
    const startDate = new Date(`${data.startDate}T${data.startTime}`);

    let freq = RRule.WEEKLY;
    if (data.frequency === "daily") freq = RRule.DAILY;
    else if (data.frequency === "monthly") freq = RRule.MONTHLY;

    const options: any = {
      freq,
      dtstart: startDate,
    };

    if (data.frequency === "weekly" && data.weekdays?.length) {
      options.byweekday = data.weekdays;
    }

    if (data.endType === "date" && data.endDate) {
      options.until = new Date(`${data.endDate}T23:59:59`);
    } else if (data.endType === "count" && data.endCount) {
      options.count = data.endCount;
    }

    return new RRule(options).toString();
  };

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: ShowTemplateFormValues) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(
        startDateTime.getTime() + data.duration * 60 * 1000,
      );
      const recurringPattern = createRecurringPattern(data);

      const showData = {
        ...data,
        startTime: startDateTime,
        endTime: endDateTime,
        recurringPattern,
      };

      if (show?.id) {
        const response = await fetch(`/api/shows/${show.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(showData),
        });
        if (!response.ok) throw new Error("Failed to update template");
        return response.json();
      } else {
        const response = await fetch("/api/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(showData),
        });
        if (!response.ok) throw new Error("Failed to create template");
        return response.json();
      }
    },
    onSuccess: (savedShow) => {
      toast({
        title: "Template Saved",
        description: show?.id
          ? "Show template updated successfully"
          : "Show template created successfully",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
      });
      onSave?.(savedShow);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    },
  });

  // Save future only mutation (creates new template from current date forward)
  const saveFutureOnlyMutation = useMutation({
    mutationFn: async (data: ShowTemplateFormValues) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(
        startDateTime.getTime() + data.duration * 60 * 1000,
      );
      const recurringPattern = createRecurringPattern(data);

      const showData = {
        ...data,
        startTime: startDateTime,
        endTime: endDateTime,
        recurringPattern,
        parentId: null, // Create new series
      };

      return apiRequest("/api/shows", {
        method: "POST",
        body: JSON.stringify(showData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Future Template Saved",
        description: "New template created for future shows",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save future template",
        variant: "destructive",
      });
    },
  });

  // Cancel series mutation
  const cancelSeriesMutation = useMutation({
    mutationFn: async () => {
      if (!show?.id) throw new Error("No show to cancel");

      return apiRequest(`/api/shows/${show.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Series Cancelled",
        description: "The recurring show series has been cancelled",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel series",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShowTemplateFormValues) => {
    saveTemplateMutation.mutate(data);
  };

  const handleSaveFutureOnly = () => {
    const data = form.getValues();
    saveFutureOnlyMutation.mutate(data);
  };

  const handleCancelSeries = () => {
    cancelSeriesMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit Show Template
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Changes here will apply to the recurring pattern of shows
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
                  Basic Information
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

            {/* Schedule & Recurrence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule & Recurrence
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

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          max="1440"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("frequency") === "weekly" && (
                  <FormField
                    control={form.control}
                    name="weekdays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days of Week</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 0, label: "Sun" },
                            { value: 1, label: "Mon" },
                            { value: 2, label: "Tue" },
                            { value: 3, label: "Wed" },
                            { value: 4, label: "Thu" },
                            { value: 5, label: "Fri" },
                            { value: 6, label: "Sat" },
                          ].map((day) => (
                            <div
                              key={day.value}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`day-${day.value}`}
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, day.value]);
                                  } else {
                                    field.onChange(
                                      current.filter(
                                        (d: number) => d !== day.value,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`day-${day.value}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {day.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="endType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Condition</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select end condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="never">Never ends</SelectItem>
                          <SelectItem value="date">End on date</SelectItem>
                          <SelectItem value="count">End after count</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("endType") === "date" && (
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
                )}

                {form.watch("endType") === "count" && (
                  <FormField
                    control={form.control}
                    name="endCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Occurrences</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Default Required Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Default Required Jobs
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
                          onClick={() =>
                            setSelectedJobs(
                              selectedJobs.filter((id) => id !== jobId),
                            )
                          }
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Select
                  onValueChange={(jobId) => {
                    if (!selectedJobs.includes(jobId)) {
                      setSelectedJobs([...selectedJobs, jobId]);
                    }
                  }}
                >
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

          {/* Default Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Default Resources
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedResources(
                              selectedResources.filter(
                                (id) => id !== resourceId,
                              ),
                            )
                          }
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Select
                  onValueChange={(resourceId) => {
                    if (!selectedResources.includes(resourceId)) {
                      setSelectedResources([...selectedResources, resourceId]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add default resource..." />
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
                        placeholder="Add any additional notes..."
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
                disabled={saveTemplateMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saveTemplateMutation.isPending ? "Saving..." : "Save Series"}
              </Button>

              {show?.recurringPattern && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveFutureOnly}
                  disabled={saveFutureOnlyMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {saveFutureOnlyMutation.isPending
                    ? "Saving..."
                    : "Save Future Only"}
                </Button>
              )}
            </div>

            {show?.recurringPattern && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Cancel Series
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Show Series</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel the entire recurring show series. All
                      future occurrences will be cancelled. This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Series</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSeries}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={cancelSeriesMutation.isPending}
                    >
                      {cancelSeriesMutation.isPending
                        ? "Cancelling..."
                        : "Cancel Series"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
