import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShowSchema } from "@shared/schema";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { Save, Calendar, X, AlertTriangle, Plus } from "lucide-react";

// Form schema for show templates
const showTemplateSchema = insertShowSchema.extend({
  startDate: z.string(),
  startTime: z.string(),
  duration: z.number().min(15).max(1440),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  weekdays: z.array(z.number()).optional(),
  endType: z.enum(["never", "date", "count"]),
  endDate: z.string().optional(),
  endCount: z.number().optional(),
});

type ShowTemplateFormValues = z.infer<typeof showTemplateSchema>;

interface ShowTemplateModalProps {
  open: boolean;
  onClose: () => void;
  show?: any;
  mode: "template" | "single";
}

export function ShowTemplateModal({
  open,
  onClose,
  show,
  mode,
}: ShowTemplateModalProps) {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workspace data
  const { data: jobs = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`],
    enabled: !!currentWorkspace?.id,
  }) as { data: any[] };

  const { data: resources = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/resources`],
    enabled: !!currentWorkspace?.id,
  }) as { data: any[] };

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
      weekdays: [1],
      endType: "never",
      status: show?.status || "scheduled",
      color: show?.color || "#3b82f6",
      notes: show?.notes || "",
      workspaceId: currentWorkspace?.id || "",
    },
  });

  // Create recurring pattern string
  const createRecurringPattern = (data: ShowTemplateFormValues): string => {
    if (mode === "single") return "";

    const freq = data.frequency;
    let pattern = `FREQ=${freq.toUpperCase()}`;

    if (data.frequency === "weekly" && data.weekdays?.length) {
      const days = data.weekdays
        .map((day) => ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][day])
        .join(",");
      pattern += `;BYDAY=${days}`;
    }

    if (data.endType === "date" && data.endDate) {
      const endDate = new Date(data.endDate);
      pattern += `;UNTIL=${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
    } else if (data.endType === "count" && data.endCount) {
      pattern += `;COUNT=${data.endCount}`;
    }

    return pattern;
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ShowTemplateFormValues) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(
        startDateTime.getTime() + data.duration * 60 * 1000,
      );
      const recurringPattern = createRecurringPattern(data);

      const showData = {
        title: data.title,
        description: data.description,
        startTime: startDateTime,
        endTime: endDateTime,
        recurringPattern: recurringPattern || null,
        status: data.status,
        color: data.color,
        notes: data.notes,
        workspaceId: currentWorkspace?.id,
      };

      if (show?.id) {
        const response = await fetch(`/api/shows/${show.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(showData),
        });
        if (!response.ok) throw new Error("Failed to update show");
        return response.json();
      } else {
        const response = await fetch("/api/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(showData),
        });
        if (!response.ok) throw new Error("Failed to create show");
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: mode === "template" ? "Template Saved" : "Show Saved",
        description:
          mode === "template"
            ? "Show template updated successfully"
            : "Show updated successfully",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!show?.id) throw new Error("No show to delete");

      const response = await fetch(`/api/shows/${show.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete show");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Show Deleted",
        description:
          mode === "template"
            ? "Show series cancelled"
            : "Show occurrence deleted",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShowTemplateFormValues) => {
    saveMutation.mutate(data);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "template" ? "Edit Show Template" : "Edit This Show"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "template"
              ? "Changes here will apply to the recurring pattern of shows"
              : "Changes here will only apply to this date"}
          </p>
        </DialogHeader>

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
                            value={field.value || ""}
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
                              <SelectItem value="scheduled">
                                Scheduled
                              </SelectItem>
                              <SelectItem value="in_progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              {mode === "single" && (
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              )}
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
                            <Input
                              type="color"
                              {...field}
                              value={field.value || "#3b82f6"}
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
                    Schedule {mode === "template" && "& Recurrence"}
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

                  {mode === "template" && (
                    <>
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
                                          field.onChange([
                                            ...current,
                                            day.value,
                                          ]);
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
                                <SelectItem value="never">
                                  Never ends
                                </SelectItem>
                                <SelectItem value="date">
                                  End on date
                                </SelectItem>
                                <SelectItem value="count">
                                  End after count
                                </SelectItem>
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
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

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
                          value={field.value || ""}
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
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending
                    ? "Saving..."
                    : mode === "template"
                      ? "Save Series"
                      : "Save This Only"}
                </Button>
              </div>

              {show?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {mode === "template"
                        ? "Cancel Series"
                        : "Delete This Occurrence"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {mode === "template"
                          ? "Cancel Show Series"
                          : "Delete Show Occurrence"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {mode === "template"
                          ? "This will cancel the entire recurring show series. All future occurrences will be cancelled. This action cannot be undone."
                          : "This will delete only this specific show occurrence. Other shows in the series will not be affected. This action cannot be undone."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending
                          ? "Deleting..."
                          : mode === "template"
                            ? "Cancel Series"
                            : "Delete Occurrence"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
