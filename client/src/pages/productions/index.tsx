import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Plus,
  Calendar,
  Users,
  Play,
  MoreVertical,
  Edit,
  Trash2,
  Layers,
  Clock,
  Target,
  Settings,
  Package
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { 
  Production, 
  InsertProduction, 
  ShowTemplate, 
  InsertShowTemplate, 
  ScheduledEvent, 
  Job, 
  Resource 
} from "@/shared/schema";

interface TemplateFormData {
  name: string;
  description: string;
  duration: number;
  recurringPattern: string;
  notes: string;
  color: string;
  requiredJobs: Array<{ jobId: string; quantity: number; notes: string }>;
  requiredResources: Array<{ resourceId: string; quantity: number; notes: string }>;
}

const recurringPatterns = [
  { value: "none", label: "No Recurring Pattern" },
  { value: "FREQ=DAILY", label: "Daily" },
  { value: "FREQ=WEEKLY", label: "Weekly" },
  { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" },
  { value: "FREQ=WEEKLY;BYDAY=SA,SU", label: "Weekends" },
  { value: "FREQ=MONTHLY", label: "Monthly" },
];

export default function Productions() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Production state
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  });

  // Template state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    duration: 60,
    recurringPattern: "none",
    notes: "",
    color: "",
    requiredJobs: [],
    requiredResources: []
  });

  // Queries
  const { data: productions = [] } = useQuery<Production[]>({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: showTemplates = [] } = useQuery<ShowTemplate[]>({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "show-templates"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: scheduledEvents = [] } = useQuery<ScheduledEvent[]>({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "scheduled-events"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "jobs"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "resources"],
    enabled: !!currentWorkspace?.id,
  });

  // Production mutations
  const createMutation = useMutation({
    mutationFn: async (data: InsertProduction) => {
      return await apiRequest("POST", `/api/workspaces/${currentWorkspace?.id}/productions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"] });
      toast({ title: "Production created successfully" });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create production", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProduction> }) => {
      return await apiRequest("PUT", `/api/productions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"] });
      toast({ title: "Production updated successfully" });
      setIsCreateModalOpen(false);
      setEditingProduction(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update production", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/productions/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"] });
      toast({ title: "Production deleted successfully" });
      if (selectedProduction?.id === deletedId) {
        setSelectedProduction(null);
      }
    },
    onError: () => {
      toast({ title: "Failed to delete production", variant: "destructive" });
    }
  });

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertShowTemplate) => {
      return await apiRequest("POST", `/api/workspaces/${currentWorkspace?.id}/show-templates`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "show-templates"] });
      toast({ title: "Template created successfully" });
      setIsTemplateModalOpen(false);
      resetTemplateForm();
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    }
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6"
    });
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      name: "",
      description: "",
      duration: 60,
      recurringPattern: "none",
      notes: "",
      color: "",
      requiredJobs: [],
      requiredResources: []
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduction) {
      updateMutation.mutate({ id: editingProduction.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, workspaceId: currentWorkspace?.id || "" });
    }
  };

  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduction) {
      toast({ title: "Please select a production first", variant: "destructive" });
      return;
    }

    const submitData = {
      ...templateFormData,
      productionId: selectedProduction.id,
      recurringPattern: templateFormData.recurringPattern === "none" ? "" : templateFormData.recurringPattern,
      workspaceId: currentWorkspace?.id || ""
    };

    createTemplateMutation.mutate(submitData);
  };

  const startEdit = (production: Production) => {
    setEditingProduction(production);
    setFormData({
      name: production.name,
      description: production.description || "",
      color: production.color || "#3b82f6"
    });
    setIsCreateModalOpen(true);
  };

  const addRequiredJob = () => {
    setTemplateFormData({
      ...templateFormData,
      requiredJobs: [...templateFormData.requiredJobs, { jobId: "", quantity: 1, notes: "" }]
    });
  };

  const removeRequiredJob = (index: number) => {
    setTemplateFormData({
      ...templateFormData,
      requiredJobs: templateFormData.requiredJobs.filter((_, i) => i !== index)
    });
  };

  const updateRequiredJob = (index: number, field: string, value: any) => {
    setTemplateFormData({
      ...templateFormData,
      requiredJobs: templateFormData.requiredJobs.map((job, i) => 
        i === index ? { ...job, [field]: value } : job
      )
    });
  };

  const addRequiredResource = () => {
    setTemplateFormData({
      ...templateFormData,
      requiredResources: [...templateFormData.requiredResources, { resourceId: "", quantity: 1, notes: "" }]
    });
  };

  const removeRequiredResource = (index: number) => {
    setTemplateFormData({
      ...templateFormData,
      requiredResources: templateFormData.requiredResources.filter((_, i) => i !== index)
    });
  };

  const updateRequiredResource = (index: number, field: string, value: any) => {
    setTemplateFormData({
      ...templateFormData,
      requiredResources: templateFormData.requiredResources.map((resource, i) => 
        i === index ? { ...resource, [field]: value } : resource
      )
    });
  };

  // Data helpers
  const getProductionTemplates = (productionId: string) => {
    return showTemplates.filter(template => template.productionId === productionId);
  };

  const getProductionTemplateCount = (productionId: string) => {
    return showTemplates.filter(template => template.productionId === productionId).length;
  };

  const getProductionEventCount = (productionId: string) => {
    return scheduledEvents.filter(event => event.productionId === productionId).length;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatRecurringPattern = (pattern: string) => {
    if (!pattern) return "One-time";
    const found = recurringPatterns.find(p => p.value === pattern);
    return found?.label || "Custom Pattern";
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Productions</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Define productions and their recurring templates
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Column - Production List */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Productions</h2>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Production
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduction ? "Edit Production" : "Create New Production"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Production Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Morning News Live"
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this production..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Production Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-8 rounded border"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setEditingProduction(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingProduction ? "Update" : "Create"} Production
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Production Cards */}
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {productions.map((production) => (
              <Card 
                key={production.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProduction?.id === production.id 
                    ? 'ring-2 ring-blue-500 shadow-md' 
                    : ''
                }`}
                onClick={() => setSelectedProduction(production)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: production.color }}
                        />
                        <h3 className="font-semibold text-sm">{production.name}</h3>
                      </div>
                      {production.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {production.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          <span>{getProductionTemplateCount(production.id)} templates</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{getProductionEventCount(production.id)} events</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(production);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(production)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Production</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{production.name}" and all its templates and scheduled events. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(production.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {productions.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500">No productions yet</p>
                  <p className="text-xs text-slate-400">Create your first production to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column - Production Details */}
        <div className="col-span-8">
          {selectedProduction ? (
            <div className="space-y-6">
              {/* Production Header */}
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedProduction.color }}
                  />
                  <h2 className="text-2xl font-bold">{selectedProduction.name}</h2>
                </div>
                {selectedProduction.description && (
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedProduction.description}
                  </p>
                )}
              </div>

              {/* Show Templates Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Show Templates</h3>
                  <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                      </Button>
                    </DialogTrigger>
                    
                    {/* Template Form Modal */}
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Create Template for "{selectedProduction.name}"
                        </DialogTitle>
                      </DialogHeader>

                      <form onSubmit={handleTemplateSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Basic Information */}
                          <div className="space-y-4">
                            <div>
                              <Label>Template Name</Label>
                              <Input
                                value={templateFormData.name}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                                placeholder="e.g., Morning News Show"
                                required
                              />
                            </div>

                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={templateFormData.description}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                                placeholder="Brief description of this template..."
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={templateFormData.duration}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, duration: parseInt(e.target.value) || 60 })}
                                min="1"
                                required
                              />
                            </div>
                          </div>

                          {/* Recurrence Settings */}
                          <div className="space-y-4">
                            <div>
                              <Label>Recurring Pattern</Label>
                              <Select
                                value={templateFormData.recurringPattern}
                                onValueChange={(value) => setTemplateFormData({ ...templateFormData, recurringPattern: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pattern" />
                                </SelectTrigger>
                                <SelectContent>
                                  {recurringPatterns.map((pattern) => (
                                    <SelectItem key={pattern.value} value={pattern.value}>
                                      {pattern.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Template Color (Optional)</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={templateFormData.color || selectedProduction.color}
                                  onChange={(e) => setTemplateFormData({ ...templateFormData, color: e.target.value })}
                                  className="w-12 h-8 rounded border"
                                />
                                <Input
                                  value={templateFormData.color || ""}
                                  onChange={(e) => setTemplateFormData({ ...templateFormData, color: e.target.value })}
                                  placeholder="Leave empty to use production color"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Notes</Label>
                              <Textarea
                                value={templateFormData.notes}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, notes: e.target.value })}
                                placeholder="Additional notes for this template..."
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Requirements Section */}
                        <Tabs defaultValue="jobs" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="jobs" className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Required Jobs ({templateFormData.requiredJobs.length})
                            </TabsTrigger>
                            <TabsTrigger value="resources" className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Required Resources ({templateFormData.requiredResources.length})
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="jobs" className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Job Requirements</Label>
                              <Button type="button" size="sm" onClick={addRequiredJob}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Required Job
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {templateFormData.requiredJobs.map((job, index) => (
                                <Card key={index} className="p-4">
                                  <div className="grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-5">
                                      <Label className="text-xs">Job</Label>
                                      <Select
                                        value={job.jobId}
                                        onValueChange={(value) => updateRequiredJob(index, "jobId", value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select job" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {jobs.map((jobOption) => (
                                            <SelectItem key={jobOption.id} value={jobOption.id}>
                                              {jobOption.title}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="col-span-2">
                                      <Label className="text-xs">Quantity</Label>
                                      <Input
                                        type="number"
                                        value={job.quantity}
                                        onChange={(e) => updateRequiredJob(index, "quantity", parseInt(e.target.value) || 1)}
                                        min="1"
                                      />
                                    </div>
                                    <div className="col-span-4">
                                      <Label className="text-xs">Notes</Label>
                                      <Input
                                        value={job.notes}
                                        onChange={(e) => updateRequiredJob(index, "notes", e.target.value)}
                                        placeholder="Optional notes..."
                                      />
                                    </div>
                                    <div className="col-span-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeRequiredJob(index)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                              
                              {templateFormData.requiredJobs.length === 0 && (
                                <Card className="p-6 text-center border-dashed">
                                  <Users className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                  <p className="text-sm text-slate-500">No job requirements added</p>
                                </Card>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="resources" className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Resource Requirements</Label>
                              <Button type="button" size="sm" onClick={addRequiredResource}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Required Resource
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {templateFormData.requiredResources.map((resource, index) => (
                                <Card key={index} className="p-4">
                                  <div className="grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-5">
                                      <Label className="text-xs">Resource</Label>
                                      <Select
                                        value={resource.resourceId}
                                        onValueChange={(value) => updateRequiredResource(index, "resourceId", value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select resource" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {resources.map((resourceOption) => (
                                            <SelectItem key={resourceOption.id} value={resourceOption.id}>
                                              {resourceOption.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="col-span-2">
                                      <Label className="text-xs">Quantity</Label>
                                      <Input
                                        type="number"
                                        value={resource.quantity}
                                        onChange={(e) => updateRequiredResource(index, "quantity", parseInt(e.target.value) || 1)}
                                        min="1"
                                      />
                                    </div>
                                    <div className="col-span-4">
                                      <Label className="text-xs">Notes</Label>
                                      <Input
                                        value={resource.notes}
                                        onChange={(e) => updateRequiredResource(index, "notes", e.target.value)}
                                        placeholder="Optional notes..."
                                      />
                                    </div>
                                    <div className="col-span-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeRequiredResource(index)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                              
                              {templateFormData.requiredResources.length === 0 && (
                                <Card className="p-6 text-center border-dashed">
                                  <Package className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                  <p className="text-sm text-slate-500">No resource requirements added</p>
                                </Card>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsTemplateModalOpen(false);
                              resetTemplateForm();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createTemplateMutation.isPending}>
                            <Clock className="h-4 w-4 mr-2" />
                            Create Template
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Templates Table */}
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Recurring Pattern</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getProductionTemplates(selectedProduction.id).map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-sm text-slate-500">{template.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(template.duration)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {formatRecurringPattern(template.recurringPattern)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Template
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Requirements
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Play className="h-4 w-4 mr-2" />
                                  Schedule Event
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {getProductionTemplates(selectedProduction.id).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="text-slate-500">
                              <Layers className="h-8 w-8 mx-auto mb-2" />
                              <p>No templates for this production yet</p>
                              <p className="text-sm">Create your first template to define recurring show patterns</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center border-dashed">
              <CardContent className="text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium mb-2">Select a Production</h3>
                <p className="text-sm text-slate-500">
                  Choose a production from the left to view and manage its templates
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}