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
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'shows'],
    enabled: !!currentWorkspace?.id,
  });
  
  const { data: crewMembers = [] } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'crew-members'],
    enabled: !!currentWorkspace?.id,
  });
  
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'resources'],
    enabled: !!currentWorkspace?.id,
  });

  // Sample crew utilization data
  const crewUtilizationData = [
    { name: 'Camera Operators', assigned: 12, available: 18 },
    { name: 'Audio Engineers', assigned: 8, available: 10 },
    { name: 'Lighting Techs', assigned: 6, available: 15 },
    { name: 'Directors', assigned: 5, available: 8 },
    { name: 'Production Asst', assigned: 10, available: 20 },
  ];

  // Sample resource usage data
  const resourceUsageData = [
    { name: 'Studio A', value: 35 },
    { name: 'Studio B', value: 25 },
    { name: 'Control Room 1', value: 20 },
    { name: 'Mobile Unit', value: 10 },
    { name: 'Equipment', value: 10 },
  ];

  // Sample show trends data (shows per month)
  const showTrendsData = [
    { name: 'Jan', shows: 12 },
    { name: 'Feb', shows: 15 },
    { name: 'Mar', shows: 18 },
    { name: 'Apr', shows: 14 },
    { name: 'May', shows: 21 },
    { name: 'Jun', shows: 25 },
  ];

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
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-gray-500 mt-1">Total scheduled in Q2</p>
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