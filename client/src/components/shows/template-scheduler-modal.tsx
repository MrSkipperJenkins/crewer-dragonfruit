import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Play, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ShowTemplate, InsertScheduledEvent } from "@/shared/schema";

interface TemplateSchedulerModalProps {
  template: ShowTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateSchedulerModal({
  template,
  isOpen,
  onClose,
}: TemplateSchedulerModalProps) {
  const { currentWorkspace } = useCurrentWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [eventData, setEventData] = useState({
    title: template.name,
    description: template.description || "",
    startDate: "",
    startTime: "09:00",
    notes: "",
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: InsertScheduledEvent) => {
      return await apiRequest(
        "POST",
        `/api/workspaces/${currentWorkspace?.id}/scheduled-events`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/workspaces", currentWorkspace?.id, "scheduled-events"],
      });
      toast({ title: "Event scheduled successfully" });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to schedule event", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEventData({
      title: template.name,
      description: template.description || "",
      startDate: "",
      startTime: "09:00",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventData.startDate || !eventData.startTime) {
      toast({ title: "Please select date and time", variant: "destructive" });
      return;
    }

    const startDateTime = new Date(
      `${eventData.startDate}T${eventData.startTime}`,
    );
    const endDateTime = new Date(
      startDateTime.getTime() + template.duration * 60 * 1000,
    );

    const scheduledEventData: InsertScheduledEvent = {
      templateId: template.id,
      productionId: template.productionId,
      title: eventData.title,
      description: eventData.description,
      startTime: startDateTime,
      endTime: endDateTime,
      notes: eventData.notes,
      status: "draft",
      color: template.color,
      workspaceId: currentWorkspace?.id || "",
    };

    createEventMutation.mutate(scheduledEventData);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule "{template.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    Duration
                  </Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">
                      {formatDuration(template.duration)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    Pattern
                  </Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">
                      {template.recurringPattern ? "Recurring" : "One-time"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input
                value={eventData.title}
                onChange={(e) =>
                  setEventData({ ...eventData, title: e.target.value })
                }
                placeholder="Event title"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={eventData.description}
                onChange={(e) =>
                  setEventData({ ...eventData, description: e.target.value })
                }
                placeholder="Event description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={eventData.startDate}
                  onChange={(e) =>
                    setEventData({ ...eventData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={eventData.startTime}
                  onChange={(e) =>
                    setEventData({ ...eventData, startTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={eventData.notes}
                onChange={(e) =>
                  setEventData({ ...eventData, notes: e.target.value })
                }
                placeholder="Additional notes for this event..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEventMutation.isPending}>
                <Play className="h-4 w-4 mr-2" />
                Schedule Event
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
