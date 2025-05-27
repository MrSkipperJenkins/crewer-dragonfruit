import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Copy, Plus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateSlug, isValidSlug } from "@/lib/utils";
import { insertWorkspaceSchema, type Workspace } from "@shared/schema";

// Extend the workspace schema for the wizard
const workspaceInfoSchema = insertWorkspaceSchema.extend({
  name: z.string().min(3, "Workspace name must be at least 3 characters"),
  slug: z.string().min(3, "URL slug must be at least 3 characters").refine(isValidSlug, "Invalid URL format")
}).omit({ region: true });

const inviteTeammatesSchema = z.object({
  emails: z.array(z.string().email("Invalid email address")).min(0).max(10)
});

type WorkspaceInfo = z.infer<typeof workspaceInfoSchema>;
type InviteTeammates = z.infer<typeof inviteTeammatesSchema>;

interface WorkspaceWizardProps {
  onCancel: () => void;
}

export function WorkspaceWizard({ onCancel }: WorkspaceWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceData, setWorkspaceData] = useState<Workspace | null>(null);
  const [inviteLink, setInviteLink] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Step 1: Workspace Info Form
  const workspaceForm = useForm<WorkspaceInfo>({
    resolver: zodResolver(workspaceInfoSchema),
    defaultValues: {
      name: "",
      slug: ""
    },
    mode: "onChange"
  });

  // Step 2: Invite Teammates Form
  const inviteForm = useForm<InviteTeammates>({
    resolver: zodResolver(inviteTeammatesSchema),
    defaultValues: {
      emails: [""]
    }
  });

  // Watch form values for real-time updates
  const watchedName = workspaceForm.watch("name");
  const watchedSlug = workspaceForm.watch("slug");

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    workspaceForm.setValue("name", value);
    if (!workspaceForm.formState.dirtyFields.slug) {
      workspaceForm.setValue("slug", generateSlug(value));
    }
  };

  // Check slug availability
  const { data: slugCheck } = useQuery({
    queryKey: ['/api/workspaces/slug-check', watchedSlug],
    enabled: watchedSlug.length >= 3 && isValidSlug(watchedSlug),
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/slug-check?slug=${watchedSlug}`);
      return response.json();
    }
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: WorkspaceInfo) => {
      return apiRequest("POST", "/api/workspaces", data);
    },
    onSuccess: (workspace: Workspace) => {
      setWorkspaceData(workspace);
      setCurrentStep(2);
      toast({
        title: "Workspace created!",
        description: "Now let's invite your teammates."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workspace. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send invites mutation
  const sendInvitesMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      if (!workspaceData) throw new Error("No workspace data");
      return apiRequest("POST", `/api/workspaces/${workspaceData.slug}/invites`, {
        emails: emails.filter(email => email.trim()),
        workspaceId: workspaceData.id
      });
    },
    onSuccess: (response: any) => {
      if (response?.inviteLink) {
        setInviteLink(response.inviteLink);
      }
      toast({
        title: "Success!",
        description: "Your workspace is ready!"
      });
      // Redirect to the new workspace
      if (workspaceData) {
        setLocation(`/workspaces/${workspaceData.slug}/dashboard`);
      }
    },
    onError: () => {
      toast({
        title: "Note",
        description: "Workspace created successfully. You can invite teammates later.",
        variant: "default"
      });
      if (workspaceData) {
        setLocation(`/workspaces/${workspaceData.slug}/dashboard`);
      }
    }
  });

  const handleStep1Submit = (data: WorkspaceInfo) => {
    createWorkspaceMutation.mutate(data);
  };

  const handleStep2Submit = (data: InviteTeammates) => {
    sendInvitesMutation.mutate(data.emails);
  };

  const addEmailField = () => {
    const currentEmails = inviteForm.getValues("emails");
    if (currentEmails.length < 10) {
      inviteForm.setValue("emails", [...currentEmails, ""]);
    }
  };

  const removeEmailField = (index: number) => {
    const currentEmails = inviteForm.getValues("emails");
    if (currentEmails.length > 1) {
      inviteForm.setValue("emails", currentEmails.filter((_, i) => i !== index));
    }
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard"
      });
    }
  };

  const isStep1Valid = watchedName.length >= 3 && 
    watchedSlug.length >= 3 && 
    isValidSlug(watchedSlug) && 
    slugCheck?.available !== false;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onCancel}
            className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <p className="text-gray-400 text-sm">
            Step {currentStep} of 2
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          {currentStep === 1 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-white mb-2">
                  Create a new workspace
                </h1>
                <p className="text-gray-400 text-sm">
                  Workspaces are shared environments where teams can work<br />
                  on projects, cycles and issues.
                </p>
              </div>

              <form onSubmit={workspaceForm.handleSubmit(handleStep1Submit)} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-300 text-sm">
                    Workspace Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Acme Inc"
                    value={watchedName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                    autoFocus
                  />
                  {workspaceForm.formState.errors.name && (
                    <p className="text-red-400 text-sm mt-1">
                      {workspaceForm.formState.errors.name.message}
                    </p>
                  )}
                  <p className="text-red-400 text-xs mt-1">Required</p>
                </div>

                <div>
                  <Label htmlFor="slug" className="text-gray-300 text-sm">
                    Workspace URL
                  </Label>
                  <Input
                    id="slug"
                    placeholder="acme-inc"
                    {...workspaceForm.register("slug")}
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                  />
                  {watchedSlug.length >= 3 && (
                    <div className="mt-1">
                      {slugCheck?.available === false && (
                        <p className="text-red-400 text-xs">This URL is already taken</p>
                      )}
                      {slugCheck?.available === true && (
                        <p className="text-green-400 text-xs">✓ Available</p>
                      )}
                    </div>
                  )}
                  {workspaceForm.formState.errors.slug && (
                    <p className="text-red-400 text-sm mt-1">
                      {workspaceForm.formState.errors.slug.message}
                    </p>
                  )}
                </div>



                <Button
                  type="submit"
                  disabled={!isStep1Valid || createWorkspaceMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {createWorkspaceMutation.isPending ? "Creating..." : "Create workspace"}
                </Button>
              </form>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-white mb-2">
                  Start with your team
                </h1>
                <p className="text-gray-400 text-sm">
                  Crewer works best with your teammates
                </p>
              </div>

              <form onSubmit={inviteForm.handleSubmit(handleStep2Submit)} className="space-y-6">
                <div>
                  <Label className="text-gray-300 text-sm mb-3 block">
                    Invite people
                  </Label>
                  
                  {inviteForm.watch("emails").map((email, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <Input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => {
                          const emails = inviteForm.getValues("emails");
                          emails[index] = e.target.value;
                          inviteForm.setValue("emails", emails);
                        }}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      {inviteForm.watch("emails").length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEmailField(index)}
                          className="border-gray-600 text-gray-400 hover:text-white"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {inviteForm.watch("emails").length < 10 && (
                    <button
                      type="button"
                      onClick={addEmailField}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add more or bulk invite
                    </button>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyInviteLink}
                    className="w-full border-gray-600 text-blue-400 hover:text-blue-300 mb-4 flex items-center justify-center gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Copy invite link
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 border-gray-600 text-gray-400 hover:text-white"
                    >
                      Back
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={sendInvitesMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {sendInvitesMutation.isPending ? "Creating..." : "Create workspace"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}