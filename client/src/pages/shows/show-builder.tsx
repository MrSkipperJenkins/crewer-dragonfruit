import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEventSchema } from "@shared/schema";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/ui/color-picker";
import { RRule } from "rrule";

// Extended form schema with recurrence fields
const formSchema = insertEventSchema.extend({
  recurrenceType: z
    .enum(["none", "daily", "weekly", "monthly", "custom"])
    .default("none"),
  recurrenceInterval: z.number().min(1).default(1),
  recurrenceWeekdays: z.array(z.string()).optional(),
  recurrenceEndType: z.enum(["never", "date", "count"]).default("never"),
  recurrenceEndDate: z.string().optional(),
  recurrenceEndCount: z.number().min(1).optional(),
  selectedResourceIds: z.array(z.string()).default([]),
  selectedCrewIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShowBuilder() {
  const [step, setStep] = useState<"details" | "resources" | "crew">("details");
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      status: "scheduled",
      priority: "medium",
      color: "#3b82f6",
      recurrenceType: "none",
      recurrenceInterval: 1,
      recurrenceWeekdays: [],
      recurrenceEndType: "never",
      selectedResourceIds: [],
      selectedCrewIds: [],
    },
  });

  // Fetch resources
  const { data: resources = [] } = useQuery({
    queryKey: ["/api/resources", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch crew members
  const { data: crewMembers = [] } = useQuery({
    queryKey: ["/api/crew-members", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const generateRRule = (data: FormValues): string | null => {
    if (data.recurrenceType === "none") return null;

    try {
      const startDate = new Date(data.startDate);
      const ruleOptions: any = {
        freq:
          data.recurrenceType === "daily"
            ? RRule.DAILY
            : data.recurrenceType === "weekly"
              ? RRule.WEEKLY
              : data.recurrenceType === "monthly"
                ? RRule.MONTHLY
                : RRule.DAILY,
        interval: data.recurrenceInterval || 1,
        dtstart: startDate,
      };

      if (data.recurrenceType === "weekly" && data.recurrenceWeekdays?.length) {
        const weekdayMap: { [key: string]: number } = {
          SU: RRule.SU,
          MO: RRule.MO,
          TU: RRule.TU,
          WE: RRule.WE,
          TH: RRule.TH,
          FR: RRule.FR,
          SA: RRule.SA,
        };
        ruleOptions.byweekday = data.recurrenceWeekdays.map(
          (day) => weekdayMap[day],
        );
      }

      if (data.recurrenceEndType === "date" && data.recurrenceEndDate) {
        ruleOptions.until = new Date(data.recurrenceEndDate);
      } else if (
        data.recurrenceEndType === "count" &&
        data.recurrenceEndCount
      ) {
        ruleOptions.count = data.recurrenceEndCount;
      }

      const rule = new RRule(ruleOptions);
      return rule.toString();
    } catch (error) {
      console.error("Error generating RRule:", error);
      return null;
    }
  };

  const createShowMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const rrule = generateRRule(data);

      const showData = {
        workspaceId: currentWorkspace!.id,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        status: data.status,
        priority: data.priority,
        color: data.color,
        rrule,
        parentId: null,
        isException: false,
      };

      const response = await apiRequest("/api/shows", {
        method: "POST",
        body: JSON.stringify(showData),
      });

      // Create resource assignments
      if (data.selectedResourceIds.length > 0) {
        for (const resourceId of data.selectedResourceIds) {
          await apiRequest("/api/resource-assignments", {
            method: "POST",
            body: JSON.stringify({
              showId: response.id,
              resourceId,
              workspaceId: currentWorkspace!.id,
            }),
          });
        }
      }

      // Create crew assignments
      if (data.selectedCrewIds.length > 0) {
        for (const crewId of data.selectedCrewIds) {
          await apiRequest("/api/crew-assignments", {
            method: "POST",
            body: JSON.stringify({
              showId: response.id,
              crewMemberId: crewId,
              workspaceId: currentWorkspace!.id,
            }),
          });
        }
      }

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Show created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      setLocation("/shows");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create show",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createShowMutation.mutate(data);
  };

  if (!currentWorkspace) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Show</h1>
        <p className="text-gray-600">
          Fill in the details to create a new show
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "details"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Show Details</CardTitle>
              <CardDescription>
                Basic information and recurrence settings
              </CardDescription>
            </div>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "resources"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Resources</CardTitle>
              <CardDescription>Assign equipment and resources</CardDescription>
            </div>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "crew"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Crew</CardTitle>
              <CardDescription>Assign crew members</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            {step === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Show Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter show name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
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
                          placeholder="Enter show description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value}
                          />
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
                        <FormLabel>End Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in-progress">
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
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

                {/* Google Calendar-style Recurrence UI */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <h3 className="text-lg font-medium">Recurrence</h3>
                    <p className="text-sm text-gray-500">
                      Configure if this show repeats on a schedule
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="recurrenceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Does not repeat</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recurrence" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              Does not repeat
                            </SelectItem>
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

                  {form.watch("recurrenceType") !== "none" && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <FormField
                        control={form.control}
                        name="recurrenceInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Repeat every{" "}
                              {form.watch("recurrenceType") === "daily"
                                ? "day(s)"
                                : form.watch("recurrenceType") === "weekly"
                                  ? "week(s)"
                                  : "month(s)"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                value={field.value || 1}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 1)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("recurrenceType") === "weekly" && (
                        <FormField
                          control={form.control}
                          name="recurrenceWeekdays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Repeat on</FormLabel>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { label: "S", value: "SU" },
                                  { label: "M", value: "MO" },
                                  { label: "T", value: "TU" },
                                  { label: "W", value: "WE" },
                                  { label: "T", value: "TH" },
                                  { label: "F", value: "FR" },
                                  { label: "S", value: "SA" },
                                ].map((day) => (
                                  <div
                                    key={day.value}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={day.value}
                                      checked={
                                        field.value?.includes(day.value) ||
                                        false
                                      }
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([
                                            ...currentValue,
                                            day.value,
                                          ]);
                                        } else {
                                          field.onChange(
                                            currentValue.filter(
                                              (value: string) =>
                                                value !== day.value,
                                            ),
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={day.value}
                                      className="text-sm font-medium"
                                    >
                                      {day.label}
                                    </Label>
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
                        name="recurrenceEndType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ends</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select end type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="never">Never</SelectItem>
                                <SelectItem value="date">On date</SelectItem>
                                <SelectItem value="count">
                                  After occurrences
                                </SelectItem>
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
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Recurrence Summary */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Summary</h4>
                        <p className="text-sm text-gray-600">
                          {(() => {
                            const type = form.watch("recurrenceType");
                            const interval =
                              form.watch("recurrenceInterval") || 1;
                            const weekdays =
                              form.watch("recurrenceWeekdays") || [];
                            const endType = form.watch("recurrenceEndType");
                            const endDate = form.watch("recurrenceEndDate");
                            const endCount = form.watch("recurrenceEndCount");

                            if (type === "none") return "Does not repeat";

                            let summary = `Repeats ${interval > 1 ? `every ${interval} ` : ""}${type}`;

                            if (type === "weekly" && weekdays.length > 0) {
                              const dayNames = weekdays
                                .map(
                                  (day) =>
                                    ({
                                      SU: "Sun",
                                      MO: "Mon",
                                      TU: "Tue",
                                      WE: "Wed",
                                      TH: "Thu",
                                      FR: "Fri",
                                      SA: "Sat",
                                    })[day],
                                )
                                .join(", ");
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
              </div>
            )}

            {step === "resources" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Select Resources</h3>
                  <p className="text-sm text-gray-500">
                    Choose equipment and resources needed for this show
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="selectedResourceIds"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.map((resource: any) => (
                          <div
                            key={resource.id}
                            className="flex items-start space-x-3 p-4 border rounded-lg"
                          >
                            <Checkbox
                              checked={field.value.includes(resource.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, resource.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter(
                                      (id: string) => id !== resource.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {resource.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {resource.category}
                              </p>
                              <Badge
                                variant={
                                  resource.availability === "available"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {resource.availability}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === "crew" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Select Crew Members</h3>
                  <p className="text-sm text-gray-500">
                    Choose crew members for this show
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="selectedCrewIds"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {crewMembers.map((crew: any) => (
                          <div
                            key={crew.id}
                            className="flex items-start space-x-3 p-4 border rounded-lg"
                          >
                            <Checkbox
                              checked={field.value.includes(crew.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, crew.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter(
                                      (id: string) => id !== crew.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{crew.name}</p>
                              <p className="text-xs text-gray-500">
                                {crew.role}
                              </p>
                              {crew.qualifications &&
                                crew.qualifications.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {crew.qualifications
                                      .slice(0, 2)
                                      .map((qual: string) => (
                                        <Badge
                                          key={qual}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {qual}
                                        </Badge>
                                      ))}
                                    {crew.qualifications.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        +{crew.qualifications.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </Form>
        </CardContent>

        <CardFooter className="flex justify-between border-t px-6 py-4">
          {step === "details" ? (
            <div></div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const steps = ["details", "resources", "crew"];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1] as any);
                }
              }}
            >
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
