import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Users, Calendar, ArrowRight, LogOut } from "lucide-react";
import type { Workspace, WorkspaceMembership } from "@shared/schema";

interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
}

export default function WorkspacesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateWorkspaceData>({
    name: "",
    slug: "",
    description: "",
  });

  // Get current user from localStorage (in a real app, this would be from a proper auth system)
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  const { data: userWorkspaces, isLoading } = useQuery({
    queryKey: [`/api/users/${currentUser.id}/workspaces`],
    enabled: !!currentUser.id,
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (workspaceData: CreateWorkspaceData & { userId: string }) => {
      const response = await apiRequest("POST", "/api/workspaces", workspaceData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workspace created",
        description: "Your new workspace has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/workspaces`] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", slug: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create workspace",
        description: error.message || "Could not create workspace",
        variant: "destructive",
      });
    },
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the workspace name and slug",
        variant: "destructive",
      });
      return;
    }

    createWorkspaceMutation.mutate({
      ...formData,
      userId: currentUser.id,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setLocation("/login");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!currentUser.id) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Workspaces</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {currentUser.name}! Select a workspace to continue.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Workspace
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                  <DialogDescription>
                    Set up a new workspace for your production team.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateWorkspace} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Workspace Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Morning Show Productions"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={createWorkspaceMutation.isPending}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Workspace Slug</Label>
                    <Input
                      id="slug"
                      placeholder="e.g., morning-show"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      disabled={createWorkspaceMutation.isPending}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of your workspace"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      disabled={createWorkspaceMutation.isPending}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createWorkspaceMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createWorkspaceMutation.isPending}>
                      {createWorkspaceMutation.isPending ? "Creating..." : "Create Workspace"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userWorkspaces && Array.isArray(userWorkspaces) && userWorkspaces.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(userWorkspaces as (Workspace & { membership: WorkspaceMembership })[]).map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  localStorage.setItem("currentWorkspace", JSON.stringify(item));
                  setLocation("/");
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <Badge className={getRoleColor(item.membership.role)}>
                      {item.membership.role}
                    </Badge>
                  </div>
                  <CardDescription>{item.description || "No description"}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Team workspace</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Active</span>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="w-full mt-4">
                    Enter Workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workspaces Found</h3>
            <p className="text-gray-600 mb-6">
              You haven't joined any workspaces yet. Create your first workspace to get started.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}