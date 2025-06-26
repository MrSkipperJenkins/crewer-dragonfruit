import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertShowCategorySchema,
  insertWorkspaceSchema,
} from "@shared/schema";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import {
  PlusIcon,
  MoonIcon,
  SunIcon,
  MonitorIcon,
  Pencil,
  Trash2,
} from "lucide-react";

// Category form schema
const categoryFormSchema = insertShowCategorySchema.extend({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: "Color must be a valid hex color code (e.g. #3B82F6)",
  }),
});

// Workspace form schema
const workspaceFormSchema = insertWorkspaceSchema.extend({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

export default function Settings() {
  const { currentWorkspace } = useCurrentWorkspace();
  const [, setLocation] = useLocation();

  // Fetch workspaces data
  const { data: workspaces = [] } = useQuery({
    queryKey: ["/api/workspaces"],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");

  // Fetch show categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-categories`],
    enabled: !!currentWorkspace?.id,
  });

  // Category form
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      color: "#3B82F6",
      workspaceId: currentWorkspace?.id || "",
    },
  });

  // Workspace form
  const workspaceForm = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: currentWorkspace?.name || "",
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      return apiRequest("POST", "/api/show-categories", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-categories`],
      });
      categoryForm.reset({
        name: "",
        color: "#3B82F6",
        workspaceId: currentWorkspace?.id || "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
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
    onSuccess: (response) => {
      response.json().then((workspace) => {
        toast({
          title: "Success",
          description: "Workspace created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
        // Workspace will be automatically selected by URL routing
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      });
    },
  });

  // Category form submission handler
  const onCategorySubmit = (data: CategoryFormValues) => {
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
    createCategoryMutation.mutate(data);
  };

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
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categories">Show Categories</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Theme</h3>
                <div className="flex space-x-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="flex items-center"
                  >
                    <SunIcon className="h-4 w-4 mr-1" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="flex items-center"
                  >
                    <MoonIcon className="h-4 w-4 mr-1" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                    className="flex items-center"
                  >
                    <MonitorIcon className="h-4 w-4 mr-1" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notification settings would go here */}
              <p className="text-sm text-gray-500">
                Notification settings are coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Show Categories</CardTitle>
              <CardDescription>
                Create and manage categories for your shows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...categoryForm}>
                <form
                  onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Category Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. News, Sports, Entertainment"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoryForm.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-6 h-6 rounded-full border"
                              style={{ backgroundColor: field.value }}
                            />
                            <FormControl>
                              <Input type="text" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {createCategoryMutation.isPending
                      ? "Adding..."
                      : "Add Category"}
                  </Button>
                </form>
              </Form>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCategories ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : categories.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-4 text-gray-500"
                        >
                          No categories found
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            {category.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span>{category.color}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>
                Manage workspace information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...workspaceForm}>
                <form
                  onSubmit={workspaceForm.handleSubmit(onWorkspaceSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={workspaceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. My Production Company"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is the name of your workspace as it appears
                          throughout the app.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={
                      updateWorkspaceMutation.isPending ||
                      createWorkspaceMutation.isPending
                    }
                  >
                    {currentWorkspace?.id
                      ? "Update Workspace"
                      : "Create Workspace"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {workspaces.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Workspaces</CardTitle>
                <CardDescription>
                  Select a workspace to work with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workspaces.map((workspace: any) => (
                    <div
                      key={workspace.id}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        currentWorkspace?.id === workspace.id
                          ? "bg-primary-50 border-primary-200"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                      onClick={() =>
                        setLocation(`/workspaces/${workspace.slug}`)
                      }
                    >
                      <div>
                        <h3 className="font-medium">{workspace.name}</h3>
                        <p className="text-sm text-gray-500">
                          Created:{" "}
                          {new Date(workspace.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {currentWorkspace?.id === workspace.id && (
                        <Badge>Current</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
