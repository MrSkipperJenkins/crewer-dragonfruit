import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Activity, Users, Calendar, Building, 
  BarChart2, Clock, AlertTriangle, Bell
} from "lucide-react";

export default function Dashboard() {
  const { currentWorkspace } = useWorkspace();
  
  // Fetch shows
  const { data: shows = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch crew members
  const { data: crewMembers = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-members`],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch resources
  const { data: resources = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/resources`],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/users/38ccfc25-287d-4ac1-b832-5a5f3a1b1575/notifications'],
    enabled: !!currentWorkspace?.id,
  });

  // Debug logging to see what data we're getting
  console.log("Dashboard data:", { shows, crewMembers, resources, notifications });
  
  // Dashboard metrics
  const activeShows = shows.filter((show: any) => show.status === 'scheduled' || show.status === 'in_progress').length;
  const upcomingShows = shows.filter((show: any) => {
    const showDate = new Date(show.startTime);
    const today = new Date();
    return showDate > today && show.status === 'scheduled';
  }).length;
  
  const resourceTypes = {
    studio: resources.filter((resource: any) => resource.type === 'studio').length,
    controlRoom: resources.filter((resource: any) => resource.type === 'control_room').length,
    equipment: resources.filter((resource: any) => resource.type === 'equipment').length,
  };
  
  const alerts = notifications.filter((notification: any) => 
    notification.type === 'warning' || notification.type === 'error'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-500 mt-1">Welcome back to Crewer. Here's what's happening in your workspace.</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Shows</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeShows}</div>
            <p className="text-xs text-gray-500 mt-1">Currently scheduled shows</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Crew Members</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crewMembers.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total crew members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Shows</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingShows}</div>
            <p className="text-xs text-gray-500 mt-1">Shows in the next 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts}</div>
            <p className="text-xs text-gray-500 mt-1">Scheduling conflicts and issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resource Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Studios</span>
              </div>
              <span className="text-sm font-bold">{resourceTypes.studio}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Control Rooms</span>
              </div>
              <span className="text-sm font-bold">{resourceTypes.controlRoom}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Equipment</span>
              </div>
              <span className="text-sm font-bold">{resourceTypes.equipment}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Notifications</CardTitle>
            <Link href="/notifications" className="text-xs text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                  <Bell className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-600">No notifications</p>
                <p className="text-xs text-gray-500 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <>
                {notifications.slice(0, 4).map((notification: any) => (
                  <div key={notification.id} className="flex items-start space-x-3">
                    <div className={`mt-0.5 rounded-full p-1.5 ${
                      notification.type === 'success' ? 'bg-green-100 text-green-600' :
                      notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                      notification.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {notification.type === 'success' ? (
                        <Clock className="h-3 w-3" />
                      ) : notification.type === 'warning' ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : notification.type === 'error' ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">{notification.title}</p>
                        {!notification.read && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{notification.message}</p>
                      {notification.relatedEntityType && (
                        <p className="text-xs text-gray-400">
                          Related to: {notification.relatedEntityType.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Schedule Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-8 text-xs font-medium">
              <div className="border-r p-2 text-center text-gray-500 bg-gray-50"></div>
              <div className="border-r p-2 text-center text-gray-500 bg-gray-50">Monday</div>
              <div className="border-r p-2 text-center text-gray-500 bg-gray-50">Tuesday</div>
              <div className="border-r p-2 text-center text-gray-500 bg-gray-50">Wednesday</div>
              <div className="border-r p-2 text-center text-gray-500 bg-gray-50">Thursday</div>
              <div className="border-r p-2 text-center text-gray-500 bg-gray-50">Friday</div>
              <div className="border-r p-2 text-center text-gray-500 bg-gray-50">Saturday</div>
              <div className="p-2 text-center text-gray-500 bg-gray-50">Sunday</div>
            </div>
            
            <div className="grid grid-cols-8 border-t text-xs">
              <div className="border-r p-2 font-medium text-gray-500 bg-gray-50">Morning</div>
              <div className="border-r p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-green-100 border-l-2 border-green-500 flex items-center text-xs">
                  Morning News
                </div>
              </div>
              <div className="border-r p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-green-100 border-l-2 border-green-500 flex items-center text-xs">
                  Morning News
                </div>
              </div>
              <div className="border-r p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-green-100 border-l-2 border-green-500 flex items-center text-xs">
                  Morning News
                </div>
              </div>
              <div className="border-r p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-green-100 border-l-2 border-green-500 flex items-center text-xs">
                  Morning News
                </div>
              </div>
              <div className="border-r p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-green-100 border-l-2 border-green-500 flex items-center text-xs">
                  Morning News
                </div>
              </div>
              <div className="border-r p-2"></div>
              <div className="p-2"></div>
            </div>
            
            <div className="grid grid-cols-8 border-t text-xs">
              <div className="border-r p-2 font-medium text-gray-500 bg-gray-50">Afternoon</div>
              <div className="border-r p-2"></div>
              <div className="border-r p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-blue-100 border-l-2 border-blue-500 flex items-center text-xs">
                  Cooking Show
                </div>
              </div>
              <div className="border-r p-2"></div>
              <div className="border-r p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-purple-100 border-l-2 border-purple-500 flex items-center text-xs">
                  Talk Show
                </div>
              </div>
              <div className="border-r p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-purple-100 border-l-2 border-purple-500 flex items-center text-xs">
                  Talk Show
                </div>
              </div>
              <div className="border-r p-2"></div>
              <div className="p-2 relative">
                <div className="absolute inset-0 m-1 rounded px-1 py-0.5 bg-orange-100 border-l-2 border-orange-500 flex items-center text-xs">
                  Sports Review
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
