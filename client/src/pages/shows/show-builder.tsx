import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertShowSchema } from "@shared/schema";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ColorPicker } from "@/components/ui/color-picker";
import { RRule } from "rrule";

// Extend the insertShowSchema with validation rules
const formSchema = insertShowSchema.extend({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  startTime: z.string().refine((val) => !!val, {
    message: "Start time is required",
  }),
  endTime: z.string().refine((val) => !!val, {
    message: "End time is required",
  }),
  categoryId: z.string().optional(),
  selectedResources: z.array(z.string()).optional(),
  selectedJobs: z.array(z.string()).optional(),
  recurringDays: z.array(z.string()).optional(),
  // Recurrence fields
  recurrenceType: z.enum(["none", "daily", "weekly", "monthly", "custom"]).default("none"),
  recurrenceInterval: z.number().min(1).default(1),
  recurrenceWeekdays: z.array(z.string()).optional(),
  recurrenceMonthlyType: z.enum(["day", "weekday"]).optional(),
  recurrenceEndType: z.enum(["never", "date", "count"]).default("never"),
  recurrenceEndDate: z.string().optional(),
  recurrenceEndCount: z.number().min(1).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShowBuilder() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"details" | "resources" | "crew">("details");

  // Helper function to get next 15-minute interval in local time
  const getNext15MinuteSlot = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const nextQuarter = Math.ceil(minutes / 15) * 15;
    
    if (nextQuarter === 60) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    } else {
      now.setMinutes(nextQuarter);
    }
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    // Format for datetime-local input in local time (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  // Helper function to format date for datetime-local input in local time
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  const defaultStartTime = getNext15MinuteSlot();
  const defaultEndTime = (() => {
    const start = new Date(defaultStartTime);
    start.setHours(start.getHours() + 1); // Default to 1 hour duration
    return formatDateTimeLocal(start);
  })();

  const defaultValues: Partial<FormValues> = {
    title: "",
    description: "",
    status: "draft",
    color: "#3b82f6",
    workspaceId: currentWorkspace?.id || "",
    selectedResources: [],
    selectedJobs: [],
    recurringDays: [],
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    recurrenceType: "none",
    recurrenceInterval: 1,
    recurrenceWeekdays: [],
    recurrenceMonthlyType: "day",
    recurrenceEndType: "never",
    recurrenceEndDate: "",
    recurrenceEndCount: 1,
  };

  // Use form hook with schema validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-categories`],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch resources for selection
  const { data: resources = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/resources`],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch jobs for selection
  const { data: jobs = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`],
    enabled: !!currentWorkspace?.id,
  });

  // Group resources by type
  const resourcesByType = (resources as any[]).reduce((acc: any, resource: any) => {
    const { type } = resource;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(resource);
    return acc;
  }, {});

  // Helper function to generate RRULE string
  const generateRRule = (data: FormValues): string | null => {
    if (data.recurrenceType === "none") return null;
    
    const options: any = {
      freq: data.recurrenceType === "daily" ? RRule.DAILY :
            data.recurrenceType === "weekly" ? RRule.WEEKLY :
            data.recurrenceType === "monthly" ? RRule.MONTHLY : RRule.DAILY,
      interval: data.recurrenceInterval,
    };
    
    // Add weekdays for weekly recurrence
    if (data.recurrenceType === "weekly" && data.recurrenceWeekdays?.length) {
      const weekdayMap: { [key: string]: number } = {
        'SU': RRule.SU.weekday, 'MO': RRule.MO.weekday, 'TU': RRule.TU.weekday,
        'WE': RRule.WE.weekday, 'TH': RRule.TH.weekday, 'FR': RRule.FR.weekday, 'SA': RRule.SA.weekday
      };
      options.byweekday = data.recurrenceWeekdays.map(day => weekdayMap[day]).filter(Boolean);
    }
    
    // Add end conditions
    if (data.recurrenceEndType === "date" && data.recurrenceEndDate) {
      options.until = new Date(data.recurrenceEndDate);
    } else if (data.recurrenceEndType === "count" && data.recurrenceEndCount) {
      options.count = data.recurrenceEndCount;
    }
    
    return new RRule(options).toString();
  };

  // Create show mutation
  const createShowMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Extract resource IDs and job IDs for separate API calls
      const { selectedResources, selectedJobs, categoryId, recurringDays, recurrenceType, recurrenceInterval, recurrenceWeekdays, recurrenceEndType, recurrenceEndDate, recurrenceEndCount, ...showData } = data;
      
      // Convert datetime-local values to proper UTC ISO strings
      if (showData.startTime) {
        showData.startTime = new Date(showData.startTime).toISOString();
      }
      if (showData.endTime) {
        showData.endTime = new Date(showData.endTime).toISOString();
      }
      
      // Generate RRULE string from recurrence fields
      const rruleString = generateRRule(data);
      if (rruleString) {
        showData.recurringPattern = rruleString;
      }
      
      // Legacy support: Process recurring pattern if days are selected
      if (recurringDays && recurringDays.length > 0) {
        showData.recurringPattern = `WEEKLY:${recurringDays.join(',')}`;
      }
      
      // Create the show first
      const response = await apiRequest("POST", "/api/shows", showData);
      const show = await response.json();
      
      const promises = [];
      const conflictedResources: string[] = [];
      
      // If category is selected, create category assignment
      if (categoryId) {
        promises.push(
          apiRequest("POST", "/api/show-category-assignments", {
            showId: show.id,
            categoryId,
            workspaceId: currentWorkspace?.id,
          })
        );
      }
      
      // Assign selected resources to the show with conflict handling
      if (selectedResources && selectedResources.length > 0) {
        for (const resourceId of selectedResources) {
          promises.push(
            apiRequest("POST", "/api/show-resources", {
              showId: show.id,
              resourceId,
              workspaceId: currentWorkspace?.id,
            }).catch(async (error) => {
              if (error.status === 409) {
                // Find resource name for better error message
                const resource = (resources as any[])?.find(r => r.id === resourceId);
                conflictedResources.push(resource?.name || 'Unknown resource');
              }
              throw error;
            })
          );
        }
      }
      
      // Add required jobs for the show
      if (selectedJobs && selectedJobs.length > 0) {
        for (const jobId of selectedJobs) {
          promises.push(
            apiRequest("POST", "/api/required-jobs", {
              showId: show.id,
              jobId,
              workspaceId: currentWorkspace?.id,
            })
          );
        }
      }
      
      // Wait for all promises to complete, ignoring 409 conflicts
      const results = await Promise.allSettled(promises);
      
      // Check for any conflicts and show user-friendly message
      if (conflictedResources.length > 0) {
        toast({
          title: "Show Created with Scheduling Conflicts",
          description: `Some resources couldn't be assigned due to conflicts: ${conflictedResources.join(', ')}. Check the show details to reassign them.`,
          variant: "destructive",
        });
      }
      
      return show;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Show created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`] });
      form.reset();
      setStep("details");
      setLocation(`/workspaces/${currentWorkspace?.slug || currentWorkspace?.id}/shows/calendar`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create show",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    // Only proceed with show creation if we're on the final step
    if (step !== "crew") {
      return;
    }
    
    if (!currentWorkspace?.id) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data for submission - keep datetime-local format for schema transformation
    const submitData = {
      ...data,
      workspaceId: currentWorkspace.id,
    };
    
    // Submit mutation with all form data
    createShowMutation.mutate(submitData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Show</h1>
        <p className="text-gray-500 mt-1">Build a new show by setting up details, resources, and crew requirements</p>
      </div>

      <Card>
        <CardHeader>
          <Tabs defaultValue="details" className="w-full" value={step} onValueChange={(value) => setStep(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Show Details</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="crew">Crew Requirements</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="px-6 pt-4">
          <Form {...form}>
            {step === "details" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the show title" {...field} />
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
                          className="resize-none" 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
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
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                            <SelectValue placeholder="Select a status" />
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
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Color</FormLabel>
                      <FormControl>
                        <ColorPicker
                          value={field.value || "#3b82f6"}
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
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(categories as any[]).map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categorize your show for easier filtering
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Recurrence Section */}
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-base font-medium">Recurring Schedule</Label>
                  
                  <FormField
                    control={form.control}
                    name="recurrenceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Does not repeat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Does not repeat</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom Recurrence Options */}
                  {form.watch("recurrenceType") !== "none" && (
                    <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                      
                      {/* Interval Selection */}
                      {(form.watch("recurrenceType") === "custom" || form.watch("recurrenceType") === "daily" || form.watch("recurrenceType") === "weekly" || form.watch("recurrenceType") === "monthly") && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Repeat every</span>
                          <FormField
                            control={form.control}
                            name="recurrenceInterval"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="999"
                                    className="w-20"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <span className="text-sm">
                            {form.watch("recurrenceType") === "daily" && (form.watch("recurrenceInterval") === 1 ? "day" : "days")}
                            {form.watch("recurrenceType") === "weekly" && (form.watch("recurrenceInterval") === 1 ? "week" : "weeks")}
                            {form.watch("recurrenceType") === "monthly" && (form.watch("recurrenceInterval") === 1 ? "month" : "months")}
                            {form.watch("recurrenceType") === "custom" && ""}
                          </span>
                        </div>
                      )}

                      {/* Weekly Options */}
                      {(form.watch("recurrenceType") === "weekly" || form.watch("recurrenceType") === "custom") && (
                        <div className="space-y-2">
                          <Label className="text-sm">Repeat on</Label>
                          <div className="flex flex-wrap gap-2">
                            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day, index) => {
                              const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                              const fullDayName = dayNames[index];
                              return (
                                <FormField
                                  key={day}
                                  control={form.control}
                                  name="recurrenceWeekdays"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Button
                                          type="button"
                                          variant={field.value?.includes(day) ? "default" : "outline"}
                                          size="sm"
                                          className="w-10 h-10 p-0"
                                          onClick={() => {
                                            const currentValue = field.value || [];
                                            if (currentValue.includes(day)) {
                                              field.onChange(currentValue.filter((d: string) => d !== day));
                                            } else {
                                              field.onChange([...currentValue, day]);
                                            }
                                          }}
                                        >
                                          {day}
                                        </Button>
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Monthly Options */}
                      {(form.watch("recurrenceType") === "monthly" || form.watch("recurrenceType") === "custom") && (
                        <FormField
                          control={form.control}
                          name="recurrenceMonthlyType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Monthly repeat type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="day">On the same day each month</SelectItem>
                                  <SelectItem value="weekday">On the same weekday each month</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* End Options */}
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="recurrenceEndType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Ends</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="never">Never</SelectItem>
                                  <SelectItem value="date">On date</SelectItem>
                                  <SelectItem value="count">After occurrences</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch("recurrenceEndType") === "date" && (
                          <FormField
                            control={form.control}
                            name="recurrenceEndDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {form.watch("recurrenceEndType") === "count" && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">After</span>
                            <FormField
                              control={form.control}
                              name="recurrenceEndCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="999"
                                      className="w-20"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-sm">occurrences</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {step === "resources" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Select Resources</h3>
                  <p className="text-gray-500 text-sm">Choose studios, control rooms, and equipment for this show</p>
                </div>
                
                {Object.keys(resourcesByType).map((type) => (
                  <div key={type} className="space-y-2">
                    <h4 className="font-medium capitalize">{type.replace('_', ' ')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {resourcesByType[type].map((resource: any) => (
                        <FormField
                          key={resource.id}
                          control={form.control}
                          name="selectedResources"
                          render={({ field }) => (
                            <FormItem key={resource.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(resource.id) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, resource.id]);
                                    } else {
                                      field.onChange(currentValue.filter((value: string) => value !== resource.id));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">
                                {resource.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {step === "crew" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Crew Requirements</h3>
                  <p className="text-gray-500 text-sm">Select the jobs/roles required for this show</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(jobs as any[]).map((job: any) => (
                    <FormField
                      key={job.id}
                      control={form.control}
                      name="selectedJobs"
                      render={({ field }) => (
                        <FormItem key={job.id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(job.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, job.id]);
                                } else {
                                  field.onChange(currentValue.filter((value: string) => value !== job.id));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            {job.title}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t px-6 py-4">
          {step === "details" ? (
            <div></div>
          ) : (
            <Button type="button" variant="outline" onClick={() => {
              const steps = ["details", "resources", "crew"];
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) {
                setStep(steps[currentIndex - 1] as any);
              }
            }}>
              Back
            </Button>
          )}
          
          {step === "crew" ? (
            <Button 
              type="button" 
              disabled={createShowMutation.isPending}
              onClick={form.handleSubmit(onSubmit)}
            >
              {createShowMutation.isPending ? "Creating..." : "Create Show"}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={() => {
                const steps = ["details", "resources", "crew"];
                const currentIndex = steps.indexOf(step);
                if (currentIndex < steps.length - 1) {
                  setStep(steps[currentIndex + 1] as any);
                }
              }}
            >
              Continue
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
                        name="recurrenceWeekdays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repeat on days</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { label: "Sun", value: "SU" },
                                { label: "Mon", value: "MO" },
                                { label: "Tue", value: "TU" },
                                { label: "Wed", value: "WE" },
                                { label: "Thu", value: "TH" },
                                { label: "Fri", value: "FR" },
                                { label: "Sat", value: "SA" }
                              ].map((day) => (
                                <FormItem key={day.value} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day.value) || false}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValue, day.value]);
                                        } else {
                                          field.onChange(currentValue.filter((value: string) => value !== day.value));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm">
                                    {day.label}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="recurrenceEndType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End recurrence</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select end type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="never">Never</SelectItem>
                              <SelectItem value="date">On date</SelectItem>
                              <SelectItem value="count">After occurrences</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("recurrenceEndType") === "date" && (
                      <FormField
                        control={form.control}
                        name="recurrenceEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch("recurrenceEndType") === "count" && (
                      <FormField
                        control={form.control}
                        name="recurrenceEndCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of occurrences</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                value={field.value || 1}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Recurrence Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Recurrence Summary</h4>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const type = form.watch("recurrenceType");
                          const interval = form.watch("recurrenceInterval") || 1;
                          const weekdays = form.watch("recurrenceWeekdays") || [];
                          const endType = form.watch("recurrenceEndType");
                          const endDate = form.watch("recurrenceEndDate");
                          const endCount = form.watch("recurrenceEndCount");

                          if (type === "none") return "No recurrence";

                          let summary = `Repeats ${interval > 1 ? `every ${interval} ` : ""}${type}`;
                          
                          if (type === "weekly" && weekdays.length > 0) {
                            const dayNames = weekdays.map(day => 
                              ({ SU: "Sun", MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat" }[day])
                            ).join(", ");
                            summary += ` on ${dayNames}`;
                          }

                          if (endType === "date" && endDate) {
                            summary += ` until ${new Date(endDate).toLocaleDateString()}`;
                          } else if (endType === "count" && endCount) {
                            summary += ` for ${endCount} occurrences`;
                          }

                          return summary;
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t px-6 py-4">
          {step === "details" ? (
            <div></div>
          ) : (
            <Button type="button" variant="outline" onClick={() => {
              const steps = ["details", "resources", "crew"];
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) {
                setStep(steps[currentIndex - 1] as any);
              }
            }}>
              Back
            </Button>
          )}
          
          {step === "crew" ? (
            <Button 
              type="button" 
              disabled={createShowMutation.isPending}
              onClick={form.handleSubmit(onSubmit)}
            >
              {createShowMutation.isPending ? "Creating..." : "Create Show"}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={() => {
                const steps = ["details", "resources", "crew"];
                const currentIndex = steps.indexOf(step);
                if (currentIndex < steps.length - 1) {
                  setStep(steps[currentIndex + 1] as any);
                }
              }}
            >
              Continue
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}