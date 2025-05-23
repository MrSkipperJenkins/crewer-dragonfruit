import { useWorkspace } from "@/hooks/use-workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from "lucide-react";

export default function Reports() {
  const { currentWorkspace } = useWorkspace();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">
          View insights and analytics for your production workflows.
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Crew Utilization</CardTitle>
            <BarChart className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Resource Usage</CardTitle>
            <PieChart className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Show Trends</CardTitle>
            <LineChart className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

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