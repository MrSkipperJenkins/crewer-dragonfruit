import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkspaceSchema } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { 
  PlusIcon, 
  MoonIcon, 
  SunIcon, 
  MonitorIcon
} from "lucide-react";

// Workspace form schema
const workspaceFormSchema = insertWorkspaceSchema.extend({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

export default function Settings() {
  const { currentWorkspace } = useCurrentWorkspace();
  const [, setLocation] = useLocation();
  
  // Fetch workspaces data
  const { data: workspaces = [] } = useQuery({
    queryKey: ['/api/workspaces'],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  
  // Workspace form
  const workspaceForm = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: currentWorkspace?.name || "",
    },
  });
  
  // Update workspace mutation
  const updateWorkspaceMutation = useMutation({
    mutationFn: async (data: WorkspaceFormValues) => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      return apiRequest("PUT", `/api/workspaces/${currentWorkspace.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workspace updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workspace",
        variant: "destructive",
      });
    },
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: WorkspaceFormValues) => {
      return apiRequest("POST", "/api/workspaces", data);
    },
    onSuccess: (newWorkspace) => {
      toast({
        title: "Success",
        description: "Workspace created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      setLocation(`/workspaces/${newWorkspace.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      });
    },
  });

  // Workspace form submission handler
  const onWorkspaceSubmit = (data: WorkspaceFormValues) => {
    if (currentWorkspace?.id) {
      // Update existing workspace
      updateWorkspaceMutation.mutate(data);
    } else {
      // Create new workspace
      createWorkspaceMutation.mutate(data);
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="general" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how Crewer looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="flex items-center space-x-2"
                  >
                    <SunIcon className="h-4 w-4" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="flex items-center space-x-2"
                  >
                    <MoonIcon className="h-4 w-4" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                    className="flex items-center space-x-2"
                  >
                    <MonitorIcon className="h-4 w-4" />
                    <span>System</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Show Labels</CardTitle>
              <CardDescription>
                Shows now use simple labels instead of complex categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Available labels for categorizing shows:
                </p>
                <div className="flex flex-wrap gap-2">
                  {["News", "Drama", "Documentary", "Taper", "External Hit", "Rehearsal"].map(label => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Labels can be assigned when creating or editing shows. Custom labels can also be entered manually.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>
                Manage your workspace preferences and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...workspaceForm}>
                <form onSubmit={workspaceForm.handleSubmit(onWorkspaceSubmit)} className="space-y-4">
                  <FormField
                    control={workspaceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter workspace name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the display name for your workspace.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit"
                    disabled={updateWorkspaceMutation.isPending || createWorkspaceMutation.isPending}
                  >
                    {updateWorkspaceMutation.isPending || createWorkspaceMutation.isPending
                      ? "Saving..." 
                      : currentWorkspace?.id ? "Update Workspace" : "Create Workspace"
                    }
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Workspaces</CardTitle>
              <CardDescription>
                All workspaces you have access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.isArray(workspaces) && workspaces.length > 0 ? (
                  workspaces.map((workspace: any) => (
                    <div key={workspace.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{workspace.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(workspace.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {workspace.id === currentWorkspace?.id && (
                        <Badge>Current</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No workspaces found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}