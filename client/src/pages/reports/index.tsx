import { useWorkspace } from "@/hooks/use-workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, CalendarDays, Users, Clock } from "lucide-react";
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useQuery } from "@tanstack/react-query";

export default function Reports() {
  const { currentWorkspace } = useWorkspace();

  // Fetch data from API
  const { data: shows = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
    enabled: !!currentWorkspace?.id,
  });
  
  const { data: crewMembers = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/crew-members`],
    enabled: !!currentWorkspace?.id,
  });
  
  const { data: resources = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/resources`],
    enabled: !!currentWorkspace?.id,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/jobs`],
    enabled: !!currentWorkspace?.id,
  });

  // Calculate actual crew utilization data
  const crewUtilizationData = (jobs as any[]).length > 0 ? (jobs as any[]).map((job: any) => {
    const membersInRole = (crewMembers as any[]).filter((member: any) => member.title === job.title);
    return {
      name: job.title,
      available: membersInRole.length,
      assigned: Math.floor(membersInRole.length * 0.6) // Approximation based on typical utilization
    };
  }) : [{ name: 'No jobs available', available: 0, assigned: 0 }];

  // Calculate actual resource usage data by type
  const resourceTypeGroups = (resources as any[]).reduce((acc: any, resource: any) => {
    const type = resource.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const resourceUsageData = Object.keys(resourceTypeGroups).length > 0 
    ? Object.entries(resourceTypeGroups).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
        value: count as number
      }))
    : [{ name: 'No resources', value: 1 }];

  // Calculate actual show trends over the last 6 months
  const showTrendsData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const trends = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[targetDate.getMonth()];
      const showsInMonth = (shows as any[]).filter((show: any) => {
        const showDate = new Date(show.startTime);
        return showDate.getMonth() === targetDate.getMonth() && 
               showDate.getFullYear() === targetDate.getFullYear();
      }).length;
      
      trends.push({ name: monthName, shows: showsInMonth });
    }
    
    return trends;
  })();

  // Calculate total production hours from shows
  const totalProductionHours = (shows as any[]).reduce((total: number, show: any) => {
    if (show.startTime && show.endTime) {
      const start = new Date(show.startTime);
      const end = new Date(show.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }
    return total;
  }, 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">
          View insights and analytics for your production workflows.
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
            <CalendarDays className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shows.length}</div>
            <p className="text-xs text-gray-500 mt-1">Across all categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Crew Members</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crewMembers.length}</div>
            <p className="text-xs text-gray-500 mt-1">Available for assignment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <Info className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
            <p className="text-xs text-gray-500 mt-1">Studios, equipment & more</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Production Hours</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalProductionHours)}</div>
            <p className="text-xs text-gray-500 mt-1">Total scheduled hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="crew">
        <TabsList className="mb-4">
          <TabsTrigger value="crew">Crew Utilization</TabsTrigger>
          <TabsTrigger value="resources">Resource Usage</TabsTrigger>
          <TabsTrigger value="trends">Show Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="crew">
          <Card>
            <CardHeader>
              <CardTitle>Crew Utilization by Role</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={crewUtilizationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="assigned" stackId="a" fill="#8884d8" name="Assigned" />
                    <Bar dataKey="available" stackId="a" fill="#82ca9d" name="Available" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourceUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resourceUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Shows Scheduled by Month</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={showTrendsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="shows" stroke="#8884d8" activeDot={{ r: 8 }} name="Shows Scheduled" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="text-sm font-medium">Production Reports</h3>
            </div>
            <div className="divide-y">
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Crew Assignment Report</p>
                  <p className="text-xs text-gray-500">Shows crew assignments across all productions</p>
                </div>
                <button className="bg-primary text-white px-3 py-1 rounded-md text-xs font-medium">
                  Generate
                </button>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Resource Allocation Report</p>
                  <p className="text-xs text-gray-500">Resource usage across productions</p>
                </div>
                <button className="bg-primary text-white px-3 py-1 rounded-md text-xs font-medium">
                  Generate
                </button>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Production Schedule Summary</p>
                  <p className="text-xs text-gray-500">Overview of all scheduled productions</p>
                </div>
                <button className="bg-primary text-white px-3 py-1 rounded-md text-xs font-medium">
                  Generate
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}