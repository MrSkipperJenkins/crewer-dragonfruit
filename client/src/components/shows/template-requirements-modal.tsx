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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Users,
  Package,
  Briefcase
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ShowTemplate, Job, Resource } from "@/shared/schema";

interface TemplateRequirementsModalProps {
  template: ShowTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateRequirementsModal({ template, isOpen, onClose }: TemplateRequirementsModalProps) {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newJobId, setNewJobId] = useState("");
  const [newJobQuantity, setNewJobQuantity] = useState(1);
  const [newJobNotes, setNewJobNotes] = useState("");
  const [newResourceId, setNewResourceId] = useState("");
  const [newResourceQuantity, setNewResourceQuantity] = useState(1);
  const [newResourceNotes, setNewResourceNotes] = useState("");

  const { data: templateJobs = [] } = useQuery({
    queryKey: ["/api/show-templates", template.id, "required-jobs"],
    enabled: !!template.id && isOpen,
  });

  const { data: templateResources = [] } = useQuery({
    queryKey: ["/api/show-templates", template.id, "resources"],
    enabled: !!template.id && isOpen,
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "jobs"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: allResources = [] } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "resources"],
    enabled: !!currentWorkspace?.id,
  });

  const addJobMutation = useMutation({
    mutationFn: async (data: { jobId: string; quantity: number; notes: string }) => {
      return await apiRequest("POST", `/api/show-templates/${template.id}/required-jobs`, {
        ...data,
        workspaceId: currentWorkspace?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/show-templates", template.id, "required-jobs"] });
      toast({ title: "Job requirement added" });
      setNewJobId("");
      setNewJobQuantity(1);
      setNewJobNotes("");
    },
    onError: () => {
      toast({ title: "Failed to add job requirement", variant: "destructive" });
    }
  });

  const removeJobMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/template-required-jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/show-templates", template.id, "required-jobs"] });
      toast({ title: "Job requirement removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove job requirement", variant: "destructive" });
    }
  });

  const addResourceMutation = useMutation({
    mutationFn: async (data: { resourceId: string; quantity: number; notes: string }) => {
      return await apiRequest("POST", `/api/show-templates/${template.id}/resources`, {
        ...data,
        workspaceId: currentWorkspace?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/show-templates", template.id, "resources"] });
      toast({ title: "Resource requirement added" });
      setNewResourceId("");
      setNewResourceQuantity(1);
      setNewResourceNotes("");
    },
    onError: () => {
      toast({ title: "Failed to add resource requirement", variant: "destructive" });
    }
  });

  const removeResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/template-resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/show-templates", template.id, "resources"] });
      toast({ title: "Resource requirement removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove resource requirement", variant: "destructive" });
    }
  });

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (newJobId) {
      addJobMutation.mutate({
        jobId: newJobId,
        quantity: newJobQuantity,
        notes: newJobNotes,
      });
    }
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (newResourceId) {
      addResourceMutation.mutate({
        resourceId: newResourceId,
        quantity: newResourceQuantity,
        notes: newResourceNotes,
      });
    }
  };

  const getJobName = (jobId: string) => {
    const job = allJobs.find((j: Job) => j.id === jobId);
    return job?.title || "Unknown Job";
  };

  const getResourceName = (resourceId: string) => {
    const resource = allResources.find((r: Resource) => r.id === resourceId);
    return resource?.name || "Unknown Resource";
  };

  const availableJobs = allJobs.filter((job: Job) => 
    !templateJobs.some((tj: any) => tj.jobId === job.id)
  );

  const availableResources = allResources.filter((resource: Resource) => 
    !templateResources.some((tr: any) => tr.resourceId === resource.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Requirements for "{template.name}"
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Job Requirements
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resource Requirements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            {/* Add Job Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Job Requirement</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddJob} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Job</Label>
                      <Select value={newJobId} onValueChange={setNewJobId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableJobs.map((job: Job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={newJobQuantity}
                        onChange={(e) => setNewJobQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        type="submit" 
                        disabled={!newJobId || addJobMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Job
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={newJobNotes}
                      onChange={(e) => setNewJobNotes(e.target.value)}
                      placeholder="Any specific requirements or notes..."
                      rows={2}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Current Job Requirements */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Current Job Requirements</h3>
              {templateJobs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-300">No job requirements yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2">
                  {templateJobs.map((templateJob: any) => (
                    <Card key={templateJob.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-slate-500" />
                            <div>
                              <p className="font-medium">{getJobName(templateJob.jobId)}</p>
                              {templateJob.notes && (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {templateJob.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              Qty: {templateJob.quantity}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeJobMutation.mutate(templateJob.id)}
                              disabled={removeJobMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            {/* Add Resource Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Resource Requirement</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddResource} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Resource</Label>
                      <Select value={newResourceId} onValueChange={setNewResourceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select resource" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableResources.map((resource: Resource) => (
                            <SelectItem key={resource.id} value={resource.id}>
                              {resource.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={newResourceQuantity}
                        onChange={(e) => setNewResourceQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        type="submit" 
                        disabled={!newResourceId || addResourceMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={newResourceNotes}
                      onChange={(e) => setNewResourceNotes(e.target.value)}
                      placeholder="Any specific requirements or notes..."
                      rows={2}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Current Resource Requirements */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Current Resource Requirements</h3>
              {templateResources.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-300">No resource requirements yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2">
                  {templateResources.map((templateResource: any) => (
                    <Card key={templateResource.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-slate-500" />
                            <div>
                              <p className="font-medium">{getResourceName(templateResource.resourceId)}</p>
                              {templateResource.notes && (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {templateResource.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              Qty: {templateResource.quantity}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeResourceMutation.mutate(templateResource.id)}
                              disabled={removeResourceMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}