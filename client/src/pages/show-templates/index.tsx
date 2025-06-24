import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Cog,
  Users,
  Package,
  Play,
  Copy
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { TemplateRequirementsModal } from "@/components/shows/template-requirements-modal";
import { useLocation } from "wouter";
import type { ShowTemplate, InsertShowTemplate, Production } from "@/shared/schema";

function TemplateRequirementsButton({ template }: { template: ShowTemplate }) {
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);

  return (
    <>
      <Button 
        size="sm" 
        variant="outline" 
        className="flex-1"
        onClick={() => setIsRequirementsOpen(true)}
      >
        <Cog className="h-3 w-3 mr-1" />
        Requirements
      </Button>
      
      <TemplateRequirementsModal
        template={template}
        isOpen={isRequirementsOpen}
        onClose={() => setIsRequirementsOpen(false)}
      />
    </>
  );
}

interface TemplateFormData {
  productionId: string;
  name: string;
  description: string;
  duration: number;
  recurringPattern: string;
  notes: string;
  color: string;
}

const recurringPatterns = [
  { value: "", label: "No Recurring Pattern" },
  { value: "FREQ=DAILY", label: "Daily" },
  { value: "FREQ=WEEKLY", label: "Weekly" },
  { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" },
  { value: "FREQ=WEEKLY;BYDAY=SA,SU", label: "Weekends" },
  { value: "FREQ=MONTHLY", label: "Monthly" },
];

export default function ShowTemplatesPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const [location] = useLocation();
  
  // Extract production filter from URL
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const productionFilter = searchParams.get('production');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShowTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    productionId: "",
    name: "",
    description: "",
    duration: 60,
    recurringPattern: "",
    notes: "",
    color: ""
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "show-templates"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: productions = [] } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: scheduledEvents = [] } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "scheduled-events"],
    enabled: !!currentWorkspace?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertShowTemplate) => {
      return await apiRequest(`/api/workspaces/${currentWorkspace?.id}/show-templates`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "show-templates"] });
      toast({ title: "Template created successfully" });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertShowTemplate> }) => {
      return await apiRequest(`/api/show-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "show-templates"] });
      toast({ title: "Template updated successfully" });
      setEditingTemplate(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/show-templates/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "show-templates"] });
      toast({ title: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: ShowTemplate) => {
      const duplicateData = {
        productionId: template.productionId,
        name: `${template.name} (Copy)`,
        description: template.description,
        duration: template.duration,
        recurringPattern: template.recurringPattern,
        notes: template.notes,
        color: template.color
      };
      return await apiRequest(`/api/workspaces/${currentWorkspace?.id}/show-templates`, {
        method: "POST",
        body: JSON.stringify(duplicateData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "show-templates"] });
      toast({ title: "Template duplicated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to duplicate template", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      productionId: "",
      name: "",
      description: "",
      duration: 60,
      recurringPattern: "",
      notes: "",
      color: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (template: ShowTemplate) => {
    setEditingTemplate(template);
    setFormData({
      productionId: template.productionId,
      name: template.name,
      description: template.description || "",
      duration: template.duration,
      recurringPattern: template.recurringPattern || "",
      notes: template.notes || "",
      color: template.color || ""
    });
    setIsCreateModalOpen(true);
  };

  const getTemplateStats = (templateId: string) => {
    const events = scheduledEvents.filter((e: any) => e.templateId === templateId);
    const upcomingEvents = events.filter((e: any) => new Date(e.startTime) > new Date());
    return { events: events.length, upcoming: upcomingEvents.length };
  };

  const getProductionName = (productionId: string) => {
    const production = productions.find((p: Production) => p.id === productionId);
    return production?.name || "Unknown Production";
  };

  const getProductionColor = (productionId: string) => {
    const production = productions.find((p: Production) => p.id === productionId);
    return production?.color || "#3b82f6";
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatRecurringPattern = (pattern: string) => {
    const found = recurringPatterns.find(p => p.value === pattern);
    return found?.label || "Custom Pattern";
  };

  if (!currentWorkspace) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Show Templates</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Create reusable blueprints for recurring shows
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingTemplate(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Production</Label>
                  <Select
                    value={formData.productionId}
                    onValueChange={(value) => setFormData({ ...formData, productionId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select production" />
                    </SelectTrigger>
                    <SelectContent>
                      {productions.map((production: Production) => (
                        <SelectItem key={production.id} value={production.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: production.color }}
                            />
                            {production.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weekday Morning News"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this template..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <Label>Recurring Pattern</Label>
                  <Select
                    value={formData.recurringPattern}
                    onValueChange={(value) => setFormData({ ...formData, recurringPattern: value })}
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
              </div>
              
              <div>
                <Label>Template Color (Optional)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color || "#3b82f6"}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-8 rounded border"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Leave empty to use production color"
                  />
                </div>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Production Filter */}
      {productionFilter && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Filtered by Production</Badge>
                <span className="font-medium">
                  {getProductionName(productionFilter)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.pushState({}, '', `/workspaces/${currentWorkspace?.slug}/templates`)}
              >
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-300 mt-2">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Cog className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Templates Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Create your first show template to get started
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates
            .filter((template: ShowTemplate) => 
              !productionFilter || template.productionId === productionFilter
            )
            .map((template: ShowTemplate) => {
            const stats = getTemplateStats(template.id);
            const displayColor = template.color || getProductionColor(template.productionId);
            
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: displayColor }}
                      />
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {getProductionName(template.productionId)}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(template.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                      {template.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>{formatDuration(template.duration)}</span>
                    </div>
                    
                    {template.recurringPattern && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span>{formatRecurringPattern(template.recurringPattern)}</span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          {stats.events}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          {stats.upcoming}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">Upcoming</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <TemplateRequirementsButton template={template} />
                      <Button size="sm" variant="outline" className="flex-1">
                        <Play className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}