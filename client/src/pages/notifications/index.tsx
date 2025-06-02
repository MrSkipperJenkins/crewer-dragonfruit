import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, Calendar, Clock, Bell, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { currentWorkspace } = useCurrentWorkspace();

  // Hardcoded user ID for demo purposes - in a real app this would come from auth
  const userId = "38ccfc25-287d-4ac1-b832-5a5f3a1b1575";

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: [`/api/users/${userId}/notifications`],
    enabled: !!userId,
  });

  const markAsRead = async (notificationId: string) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, "PUT");
      
      // Invalidate the query to refresh the notifications list
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/notifications`] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "error":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-600";
      case "warning":
        return "bg-amber-100 text-amber-600";
      case "error":
        return "bg-red-100 text-red-600";
      case "info":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle />
              <h2 className="text-lg font-semibold">Error loading notifications</h2>
            </div>
            <p className="mt-2 text-gray-600">
              There was a problem loading your notifications. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-6">
        {notifications.length > 0 && (
          <Badge variant="outline" className="ml-2">
            {notifications.filter((n: any) => !n.read).length} Unread
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Bell className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No notifications</h3>
            <p className="text-sm text-gray-500 mt-2">
              You're all caught up! You'll see notifications here when there are updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification: any) => (
          <Card key={notification.id} className={notification.read ? "opacity-75" : ""}>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-start space-x-4">
                <div className={`rounded-full p-2.5 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-base">{notification.title}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  {notification.relatedEntityType && (
                    <div className="text-xs text-gray-500">
                      Related to: {notification.relatedEntityType.replace('_', ' ')}
                    </div>
                  )}
                  {!notification.read && (
                    <div className="pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs"
                      >
                        Mark as read
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}