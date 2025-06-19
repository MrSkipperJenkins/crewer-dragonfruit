import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import { ShowTemplateModal } from "@/components/shows/show-template-modal";
import { 
  Plus, 
  Search, 
  Calendar,
  Settings,
  Clock,
  Repeat
} from "lucide-react";
import { format } from "date-fns";

export default function ShowTemplates() {
  const { currentWorkspace } = useCurrentWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [templateMode, setTemplateMode] = useState<"template" | "single">("template");

  // Fetch shows for current workspace
  const { data: shows = [], isLoading } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
    enabled: !!currentWorkspace?.id,
  }) as { data: any[], isLoading: boolean };

  // Filter shows to only show those with recurring patterns (templates)
  const recurringShows = shows.filter((show: any) => 
    show.recurringPattern && 
    show.recurringPattern !== "null" &&
    show.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTemplate = () => {
    setSelectedShow(null);
    setTemplateMode("template");
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (show: any) => {
    setSelectedShow(show);
    setTemplateMode("template");
    setShowTemplateModal(true);
  };

  const handleEditSingleShow = (show: any) => {
    setSelectedShow(show);
    setTemplateMode("single");
    setShowTemplateModal(true);
  };

  const parseRecurringPattern = (pattern: string) => {
    if (!pattern || pattern === "null") return "One-time";
    
    try {
      if (pattern.includes("FREQ=DAILY")) return "Daily";
      if (pattern.includes("FREQ=WEEKLY")) {
        const byDay = pattern.match(/BYDAY=([^;]+)/);
        if (byDay) {
          const days = byDay[1].split(",").map(day => {
            const dayMap: Record<string, string> = {
              "MO": "Mon", "TU": "Tue", "WE": "Wed", 
              "TH": "Thu", "FR": "Fri", "SA": "Sat", "SU": "Sun"
            };
            return dayMap[day] || day;
          });
          return `Weekly (${days.join(", ")})`;
        }
        return "Weekly";
      }
      if (pattern.includes("FREQ=MONTHLY")) return "Monthly";
      return "Custom";
    } catch {
      return "Custom";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Show Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage recurring show patterns and individual show overrides
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search show templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Repeat className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900">{recurringShows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Series</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recurringShows.filter(show => show.status === "scheduled").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recurringShows.filter(show => 
                    show.recurringPattern && 
                    (show.recurringPattern.includes("DAILY") || show.recurringPattern.includes("WEEKLY"))
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Show Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {recurringShows.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? "No templates match your search criteria."
                  : "Create your first show template to get started with recurring shows."
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Template
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Show Title</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Occurrence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringShows.map((show: any) => (
                  <TableRow key={show.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{show.title}</div>
                        <div className="text-sm text-gray-600">{show.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(show.startTime), "h:mm a")}</div>
                        <div className="text-gray-600">
                          {Math.floor((new Date(show.endTime).getTime() - new Date(show.startTime).getTime()) / (1000 * 60))} min
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {parseRecurringPattern(show.recurringPattern)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(show.status)} variant="outline">
                        {show.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(show.startTime), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(show)}
                          className="flex items-center gap-1"
                        >
                          <Settings className="h-3 w-3" />
                          Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSingleShow(show)}
                          className="flex items-center gap-1"
                        >
                          <Calendar className="h-3 w-3" />
                          Single
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Show Template Modal */}
      <ShowTemplateModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        show={selectedShow}
        mode={templateMode}
      />
    </div>
  );
}