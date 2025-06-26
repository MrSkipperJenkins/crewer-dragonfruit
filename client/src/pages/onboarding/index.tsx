import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Building2,
  Users,
  Briefcase,
  Monitor,
  ArrowRight,
  ArrowLeft,
  Star,
  Zap,
  Shield,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingData {
  workspaceName: string;
  workspaceDescription: string;
  organizationType: string;
  teamSize: string;
  primaryUse: string;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    workspaceName: "",
    workspaceDescription: "",
    organizationType: "",
    teamSize: "",
    primaryUse: "",
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const createWorkspaceMutation = useMutation({
    mutationFn: async (workspaceData: any) => {
      return await apiRequest("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(workspaceData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({
        title: "Welcome to Crewer!",
        description: "Your workspace has been created successfully.",
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workspace. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    createWorkspaceMutation.mutate({
      name: data.workspaceName,
      description: data.workspaceDescription,
    });
  };

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.workspaceName.trim().length > 0;
      case 2:
        return data.organizationType.length > 0;
      case 3:
        return data.teamSize.length > 0 && data.primaryUse.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <Monitor className="h-8 w-8" />
            </div>
            <span className="ml-3 text-2xl font-bold text-slate-900 dark:text-white">
              Crewer
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to Crewer
          </h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Let's set up your production workspace in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Create Your Workspace
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">
                      Give your production workspace a name and description
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Workspace Name *
                      </label>
                      <Input
                        placeholder="e.g., ABC Studios Production"
                        value={data.workspaceName}
                        onChange={(e) =>
                          updateData("workspaceName", e.target.value)
                        }
                        className="text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Description (Optional)
                      </label>
                      <Textarea
                        placeholder="Describe your production studio or company..."
                        value={data.workspaceDescription}
                        onChange={(e) =>
                          updateData("workspaceDescription", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Briefcase className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Organization Type
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">
                      What type of production organization are you?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        value: "tv_station",
                        label: "TV Station",
                        desc: "Local or national broadcaster",
                      },
                      {
                        value: "production_company",
                        label: "Production Company",
                        desc: "Independent content creator",
                      },
                      {
                        value: "streaming_service",
                        label: "Streaming Service",
                        desc: "Digital content platform",
                      },
                      {
                        value: "educational",
                        label: "Educational",
                        desc: "School or university",
                      },
                      {
                        value: "corporate",
                        label: "Corporate",
                        desc: "Company internal productions",
                      },
                      {
                        value: "other",
                        label: "Other",
                        desc: "Something else",
                      },
                    ].map((type) => (
                      <Card
                        key={type.value}
                        className={`cursor-pointer transition-all ${
                          data.organizationType === type.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                            : "hover:border-slate-300"
                        }`}
                        onClick={() =>
                          updateData("organizationType", type.value)
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                {type.label}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {type.desc}
                              </p>
                            </div>
                            {data.organizationType === type.value && (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Team & Usage
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">
                      Tell us about your team size and primary use case
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Team Size
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { value: "1-5", label: "1-5 people" },
                          { value: "6-15", label: "6-15 people" },
                          { value: "16-50", label: "16-50 people" },
                          { value: "50+", label: "50+ people" },
                        ].map((size) => (
                          <Button
                            key={size.value}
                            variant={
                              data.teamSize === size.value
                                ? "default"
                                : "outline"
                            }
                            className="h-auto py-3"
                            onClick={() => updateData("teamSize", size.value)}
                          >
                            {size.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Primary Use Case
                      </label>
                      <div className="space-y-3">
                        {[
                          {
                            value: "live_broadcasts",
                            label: "Live Broadcasts",
                            desc: "News, sports, events",
                          },
                          {
                            value: "recorded_shows",
                            label: "Recorded Shows",
                            desc: "Series, documentaries, films",
                          },
                          {
                            value: "mixed_content",
                            label: "Mixed Content",
                            desc: "Both live and recorded",
                          },
                          {
                            value: "educational",
                            label: "Educational Content",
                            desc: "Training, lectures, courses",
                          },
                        ].map((use) => (
                          <Card
                            key={use.value}
                            className={`cursor-pointer transition-all ${
                              data.primaryUse === use.value
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                : "hover:border-slate-300"
                            }`}
                            onClick={() => updateData("primaryUse", use.value)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {use.label}
                                  </h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {use.desc}
                                  </p>
                                </div>
                                {data.primaryUse === use.value && (
                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      You're All Set!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                      Ready to create your first production workspace
                    </p>
                  </div>

                  {/* Summary */}
                  <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                        Workspace Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-300">
                            Name:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {data.workspaceName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-300">
                            Organization:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {data.organizationType
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-300">
                            Team Size:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {data.teamSize} people
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-300">
                            Primary Use:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {data.primaryUse
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* What's Next */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="text-center p-4">
                      <CardContent className="p-4">
                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          Add Team Members
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Invite your crew to collaborate
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="text-center p-4">
                      <CardContent className="p-4">
                        <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          Create Jobs & Resources
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Set up your production roles
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="text-center p-4">
                      <CardContent className="p-4">
                        <Monitor className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          Schedule Shows
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Start planning productions
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Navigation */}
            <div className="px-8 pb-8">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={createWorkspaceMutation.isPending}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {createWorkspaceMutation.isPending
                      ? "Creating..."
                      : "Complete Setup"}
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Skip setup for now
          </Button>
        </div>
      </div>
    </div>
  );
}
