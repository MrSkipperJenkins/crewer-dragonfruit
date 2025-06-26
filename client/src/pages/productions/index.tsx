import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Users,
  Cog,
  Monitor,
  Play,
  Clock,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Production, InsertProduction } from "@/shared/schema";

function ProductionTemplatesButton({ productionId }: { productionId: string }) {
  const { currentWorkspace } = useCurrentWorkspace();

  return (
    <Link
      href={`/workspaces/${currentWorkspace?.slug}/templates?production=${productionId}`}
    >
      <Button size="sm" variant="outline" className="flex-1">
        <Cog className="h-3 w-3 mr-1" />
        Templates
      </Button>
    </Link>
  );
}

interface ProductionFormData {
  name: string;
  description: string;
  color: string;
}

export default function ProductionsPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<Production | null>(
    null,
  );
  const [formData, setFormData] = useState<ProductionFormData>({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const { data: productions = [], isLoading } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: showTemplates = [] } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "show-templates"],
    enabled: !!currentWorkspace?.id,
  });

  const { data: scheduledEvents = [] } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "scheduled-events"],
    enabled: !!currentWorkspace?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduction) => {
      return await apiRequest(
        "POST",
        `/api/workspaces/${currentWorkspace?.id}/productions`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"],
      });
      toast({ title: "Production created successfully" });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create production", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InsertProduction>;
    }) => {
      return await apiRequest("PUT", `/api/productions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"],
      });
      toast({ title: "Production updated successfully" });
      setEditingProduction(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update production", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/productions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/workspaces", currentWorkspace?.id, "productions"],
      });
      toast({ title: "Production deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete production", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#3b82f6" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduction) {
      updateMutation.mutate({ id: editingProduction.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (production: Production) => {
    setEditingProduction(production);
    setFormData({
      name: production.name,
      description: production.description || "",
      color: production.color || "#3b82f6",
    });
    setIsCreateModalOpen(true);
  };

  const getProductionStats = (productionId: string) => {
    const templates = showTemplates.filter(
      (t: any) => t.productionId === productionId,
    );
    const events = scheduledEvents.filter(
      (e: any) => e.productionId === productionId,
    );
    const upcomingEvents = events.filter(
      (e: any) => new Date(e.startTime) > new Date(),
    );

    return {
      templates: templates.length,
      events: events.length,
      upcoming: upcomingEvents.length,
    };
  };

  if (!currentWorkspace) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Productions
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Manage your show concepts and production pipelines
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setEditingProduction(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Production
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduction
                  ? "Edit Production"
                  : "Create New Production"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Production Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Morning News Live"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this production..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-12 h-8 rounded border"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#3b82f6"
                  />
                </div>
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
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingProduction ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Architecture Overview Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              3-Tier Scheduling Architecture
            </h3>
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg mb-2">
                <Monitor className="h-6 w-6 text-blue-600 mx-auto" />
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white">
                Productions
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                High-level show concepts
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg mb-2">
                <Cog className="h-6 w-6 text-purple-600 mx-auto" />
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white">
                Templates
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Recurring blueprints
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg mb-2">
                <Calendar className="h-6 w-6 text-green-600 mx-auto" />
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white">
                Events
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Concrete calendar items
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Productions Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Loading productions...
          </p>
        </div>
      ) : productions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Monitor className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Productions Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Start by creating your first production concept
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Production
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productions.map((production: Production) => {
            const stats = getProductionStats(production.id);

            return (
              <Card
                key={production.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: production.color }}
                      />
                      <div>
                        <CardTitle className="text-lg">
                          {production.name}
                        </CardTitle>
                        {production.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            {production.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(production)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(production.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {stats.templates}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Templates
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {stats.events}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Events
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {stats.upcoming}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Upcoming
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <ProductionTemplatesButton productionId={production.id} />
                    <Button size="sm" variant="outline" className="flex-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
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
