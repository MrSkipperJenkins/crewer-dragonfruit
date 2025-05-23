import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, List, Plus, BarChart, ArrowRight, Tag,
  Clock, AlertTriangle, CheckCircle
} from "lucide-react";

export default function Shows() {
  const { currentWorkspace } = useWorkspace();
  const [view, setView] = useState("upcoming");
  
  // Fetch shows from API
  const { data: shows = [] } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'shows'],
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch show categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'show-categories'],
    enabled: !!currentWorkspace?.id,
  });

  // Filter shows based on current view
  const upcomingShows = shows.filter((show: any) => {
    const showDate = new Date(show.startTime);
    const today = new Date();
    return showDate > today && show.status !== 'completed';
  });

  const pastShows = shows.filter((show: any) => {
    const showDate = new Date(show.startTime);
    const today = new Date();
    return showDate < today || show.status === 'completed';
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shows</h1>
          <p className="text-gray-500 mt-1">Manage and view all productions.</p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline" className="flex items-center gap-1">
            <Link href="/shows/calendar">
              <Calendar className="h-4 w-4" />
              <span>Calendar View</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-1">
            <Link href="/shows/list">
              <List className="h-4 w-4" />
              <span>List View</span>
            </Link>
          </Button>
          <Button asChild className="flex items-center gap-1">
            <Link href="/shows/builder">
              <Plus className="h-4 w-4" />
              <span>New Show</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
            <BarChart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shows.length}</div>
            <p className="text-xs text-gray-500 mt-1">All productions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingShows.length}</div>
            <p className="text-xs text-gray-500 mt-1">Shows scheduled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-gray-500 mt-1">Show types</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Scheduling conflicts</p>
          </CardContent>
        </Card>
      </div>

      {/* Shows Tabs */}
      <Card>
        <CardHeader>
          <Tabs defaultValue="upcoming" onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming Shows</TabsTrigger>
              <TabsTrigger value="past">Past Shows</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {view === "upcoming" ? (
            upcomingShows.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming shows</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/shows/builder">Create your first show</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingShows.map((show: any) => (
                  <div key={show.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{show.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(show.startTime)} - {formatDate(show.endTime)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(show.status || 'scheduled')}
                        <Button asChild variant="ghost" size="sm" className="text-xs">
                          <Link href={`/shows/builder?id=${show.id}`}>
                            <span>View Details</span>
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            pastShows.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No past shows</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastShows.map((show: any) => (
                  <div key={show.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{show.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(show.startTime)} - {formatDate(show.endTime)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(show.status || 'scheduled')}
                        <Button asChild variant="ghost" size="sm" className="text-xs">
                          <Link href={`/shows/builder?id=${show.id}`}>
                            <span>View Details</span>
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}