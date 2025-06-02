import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useWorkspace } from "@/hooks/use-workspace";
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
});

type FormValues = z.infer<typeof formSchema>;

export default function ShowBuilder() {
  const { currentWorkspace } = useWorkspace();
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

  // Create show mutation
  const createShowMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Extract resource IDs and job IDs for separate API calls
      const { selectedResources, selectedJobs, categoryId, recurringDays, ...showData } = data;
      
      // Process recurring pattern if days are selected
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
                
                <div className="space-y-2">
                  <Label>Recurring Schedule</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name="recurringDays"
                        render={({ field }) => (
                          <FormItem key={day} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day) || false}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, day]);
                                  } else {
                                    field.onChange(currentValue.filter((value: string) => value !== day));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {day.slice(0, 3)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
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
              setStep(step === "resources" ? "details" : "resources");
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
                setStep(step === "details" ? "resources" : "crew");
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