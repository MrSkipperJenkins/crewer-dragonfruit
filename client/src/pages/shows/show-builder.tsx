import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [step, setStep] = useState<"details" | "resources" | "crew">("details");

  const defaultValues: Partial<FormValues> = {
    title: "",
    description: "",
    status: "draft",
    color: "#3b82f6",
    workspaceId: currentWorkspace?.id || "",
    selectedResources: [],
    selectedJobs: [],
    recurringDays: [],
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
  const resourcesByType = resources.reduce((acc: any, resource: any) => {
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
      
      // Assign selected resources to the show
      if (selectedResources && selectedResources.length > 0) {
        for (const resourceId of selectedResources) {
          promises.push(
            apiRequest("POST", "/api/show-resources", {
              showId: show.id,
              resourceId,
              workspaceId: currentWorkspace?.id,
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
              quantity: 1,
              workspaceId: currentWorkspace?.id,
            })
          );
        }
      }
      
      // Wait for all promises to complete
      await Promise.all(promises);
      
      return show;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Show created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace?.id, 'shows'] });
      form.reset();
      setStep("details");
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
    if (!currentWorkspace?.id) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      });
      return;
    }
    
    // Add workspaceId to the data
    data.workspaceId = currentWorkspace.id;
    
    // Submit mutation
    createShowMutation.mutate(data);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="px-6 pt-4">
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
                            value={field.value}
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
                            {categories.map((category: any) => (
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
                    <FormLabel>Recurring Schedule</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "0", label: "Sunday" },
                        { value: "1", label: "Monday" },
                        { value: "2", label: "Tuesday" },
                        { value: "3", label: "Wednesday" },
                        { value: "4", label: "Thursday" },
                        { value: "5", label: "Friday" },
                        { value: "6", label: "Saturday" }
                      ].map((day) => (
                        <FormField
                          key={day.value}
                          control={form.control}
                          name="recurringDays"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={day.value}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.value)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = [...(field.value || [])];
                                      if (checked) {
                                        field.onChange([...currentValue, day.value]);
                                      } else {
                                        field.onChange(
                                          currentValue.filter((value) => value !== day.value)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {day.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormDescription>
                      Select days for recurring shows
                    </FormDescription>
                  </div>
                </div>
              )}

              {step === "resources" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Select Resources</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Choose studios, control rooms, and equipment needed for the show
                    </p>
                  </div>
                  
                  {Object.entries(resourcesByType).map(([type, items]: [string, any]) => (
                    <div key={type} className="space-y-3">
                      <h4 className="font-medium text-gray-700">
                        {type === 'studio' ? 'Studios' : 
                         type === 'control_room' ? 'Control Rooms' : 
                         'Equipment'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((resource: any) => (
                          <FormField
                            key={resource.id}
                            control={form.control}
                            name="selectedResources"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={resource.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(resource.id)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = [...(field.value || [])];
                                        if (checked) {
                                          field.onChange([...currentValue, resource.id]);
                                        } else {
                                          field.onChange(
                                            currentValue.filter((value) => value !== resource.id)
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1">
                                    <FormLabel className="font-medium text-base">
                                      {resource.name}
                                    </FormLabel>
                                    {resource.description && (
                                      <FormDescription>
                                        {resource.description}
                                      </FormDescription>
                                    )}
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === "crew" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Required Crew Positions</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Select job roles needed for this show
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {jobs.map((job: any) => (
                      <FormField
                        key={job.id}
                        control={form.control}
                        name="selectedJobs"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={job.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(job.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = [...(field.value || [])];
                                    if (checked) {
                                      field.onChange([...currentValue, job.id]);
                                    } else {
                                      field.onChange(
                                        currentValue.filter((value) => value !== job.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="font-medium text-base">
                                  {job.title}
                                </FormLabel>
                                {job.description && (
                                  <FormDescription>
                                    {job.description}
                                  </FormDescription>
                                )}
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
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
                  type="submit" 
                  disabled={createShowMutation.isPending}
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
          </form>
        </Form>
      </Card>
    </div>
  );
}
