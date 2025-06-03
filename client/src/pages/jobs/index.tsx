import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema } from "@shared/schema";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, SearchIcon, Pencil, Trash2, ArrowUpDown } from "lucide-react";

// Extend the insert schema for form validation
const formSchema = insertJobSchema.extend({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  color: z.string().min(1, "Color is required"),
});

type FormValues = z.infer<typeof formSchema>;

type SortField = 'title' | 'description';
type SortDirection = 'asc' | 'desc';

export default function Jobs() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Fetch jobs
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`],
    enabled: !!currentWorkspace?.id,
  });
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      color: "#6366f1",
      workspaceId: currentWorkspace?.id || "",
    },
  });

  // Initialize edit form
  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      color: "#6366f1",
      workspaceId: currentWorkspace?.id || "",
    },
  });
  
  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/jobs", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    },
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (data: FormValues & { id: string }) => {
      const { id, ...jobData } = data;
      const response = await apiRequest("PUT", `/api/jobs/${id}`, jobData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`] });
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingJob(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("DELETE", `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    },
  });
  
  // Handle edit job
  const handleEditJob = (job: any) => {
    setEditingJob(job);
    editForm.reset({
      title: job.title,
      description: job.description || "",
      color: job.color || "#6366f1",
      workspaceId: currentWorkspace?.id || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete job
  const handleDeleteJob = (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      deleteJobMutation.mutate(jobId);
    }
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form submission handlers
  const onSubmit = (data: FormValues) => {
    if (!currentWorkspace?.id) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      });
      return;
    }
    
    data.workspaceId = currentWorkspace.id;
    createJobMutation.mutate(data);
  };

  const onEditSubmit = (data: FormValues) => {
    if (!editingJob || !currentWorkspace?.id) return;
    
    data.workspaceId = currentWorkspace.id;
    updateJobMutation.mutate({ ...data, id: editingJob.id });
  };
  
  // Filter and sort jobs
  const filteredAndSortedJobs = ((jobs as any[]) || [])
    .filter((job: any) => {
      if (!searchQuery) return true;
      
      return (
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    })
    .sort((a: any, b: any) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xl">Job Roles</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Add New Job Role</DialogTitle>
                    <DialogDescription>
                      Create a new job role for your production crew.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Camera Operator" {...field} />
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
                              placeholder="Describe the responsibilities of this job role" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createJobMutation.isPending}
                    >
                      {createJobMutation.isPending ? "Saving..." : "Save Job"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="relative w-full max-w-sm mb-4">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search jobs..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Job Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      No jobs found
                    </TableCell>
                  </TableRow>
                )}

                {filteredJobs.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {job.description || "No description provided"}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
