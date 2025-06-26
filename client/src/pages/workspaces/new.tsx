import { useLocation } from "wouter";
import { WorkspaceWizard } from "@/components/workspace/workspace-wizard";

export default function NewWorkspacePage() {
  const [, setLocation] = useLocation();

  const handleCancel = () => {
    setLocation("/");
  };

  return <WorkspaceWizard onCancel={handleCancel} />;
}
