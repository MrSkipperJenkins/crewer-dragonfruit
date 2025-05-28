import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCrewMemberSchema } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusIcon, SearchIcon } from "lucide-react";

// Extend the insert schema for form validation
const formSchema = insertCrewMemberSchema.extend({
  name: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  selectedJobs: z.array(z.string()).min(1, {
    message: "Select at least one job.",
  }),
});

type FormValues = z.infer<typeof formSchema> & {
  selectedJobs: string[];
};

export default function CrewMembers() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debug workspace
  console.log("Current workspace:", currentWorkspace);
  console.log("Workspace ID:", currentWorkspace?.id);
  
  // Fetch crew members
  const { data: crewMembers = [], isLoading, error } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-members`],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch jobs for selection
  const { data: jobs = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`],
    enabled: !!currentWorkspace?.id,
  });
  
  // Debug queries
  console.log("Crew members query enabled:", !!currentWorkspace?.id);
  console.log("Crew members data:", crewMembers);
  console.log("Crew members error:", error);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      title: "",
      workspaceId: currentWorkspace?.id || "",
      selectedJobs: [],
    },
  });
  
  // Create crew member mutation
  const createCrewMemberMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { selectedJobs, ...crewMemberData } = data;
      
      // Create crew member
      const response = await apiRequest("POST", "/api/crew-members", crewMemberData);
      const crewMember = await response.json();
      
      // Assign jobs to crew member
      const promises = selectedJobs.map(jobId => 
        apiRequest("POST", "/api/crew-member-jobs", {
          crewMemberId: crewMember.id,
          jobId,
          workspaceId: currentWorkspace?.id,
        })
      );
      
      await Promise.all(promises);
      
      return crewMember;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Crew member created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace?.id, 'crew-members'] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create crew member",
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
    createCrewMemberMutation.mutate(data);
  };
  
  // Filter crew members based on search query
  const filteredCrewMembers = crewMembers.filter((member: any) => {
    if (!searchQuery) return true;
    
    return (
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xl">Crew Members</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Crew Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Add New Crew Member</DialogTitle>
                    <DialogDescription>
                      Enter the details of the crew member and assign their qualified jobs.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title/Position</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Camera Operator" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel>Qualified Jobs</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {jobs.map((job: any) => (
                          <FormField
                            key={job.id}
                            control={form.control}
                            name="selectedJobs"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={job.id}
                                  className="flex flex-row items-start space-x-2 space-y-0"
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
                                  <FormLabel className="font-normal cursor-pointer">
                                    {job.title}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage>
                        {form.formState.errors.selectedJobs?.message}
                      </FormMessage>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createCrewMemberMutation.isPending}
                    >
                      {createCrewMemberMutation.isPending ? "Saving..." : "Save Crew Member"}
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
              placeholder="Search crew members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredCrewMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No crew members found
                    </TableCell>
                  </TableRow>
                )}

                {filteredCrewMembers.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>{member.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{member.title}</TableCell>
                    <TableCell>
                      <div>{member.email}</div>
                      <div className="text-gray-500 text-sm">{member.phone}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
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
