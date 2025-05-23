import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  ChevronDownIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";
import ShowDetailModal from "@/components/shows/show-detail-modal";

export default function ShowsListView() {
  const { currentWorkspace } = useWorkspace();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch shows data
  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'shows'],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch show categories for each show
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'show-categories'],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch show category assignments
  const { data: categoryAssignments = [] } = useQuery({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'show-category-assignments'],
    enabled: !!currentWorkspace?.id,
  });

  // Function to get show category
  const getShowCategory = (showId: string) => {
    const assignment = categoryAssignments.find(
      (ca: any) => ca.showId === showId
    );
    
    if (!assignment) return null;
    
    return categories.find(
      (c: any) => c.id === assignment.categoryId
    );
  };

  // Filter shows based on status and search query
  const filteredShows = shows.filter((show: any) => {
    const matchesStatus = statusFilter === "all" || show.status === statusFilter;
    const matchesSearch = !searchQuery || 
      show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (show.description && show.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Function to handle row click
  const handleRowClick = (showId: string) => {
    setSelectedShow(showId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xl">Shows</CardTitle>
          <Button size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Show
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search shows..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <FilterIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="pl-8 w-[150px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Show</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredShows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No shows found
                    </TableCell>
                  </TableRow>
                )}

                {filteredShows.map((show: any) => {
                  const category = getShowCategory(show.id);
                  return (
                    <TableRow 
                      key={show.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(show.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{show.title}</div>
                        {show.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {show.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(show.startTime)}</TableCell>
                      <TableCell>
                        {formatTime(show.startTime)} - {formatTime(show.endTime)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(show.status)}>
                          {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {category && (
                          <Badge 
                            className="bg-opacity-20 text-opacity-100" 
                            style={{ 
                              backgroundColor: `${category.color}20`, 
                              color: category.color,
                              borderColor: `${category.color}40`
                            }}
                            variant="outline"
                          >
                            {category.name}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Show Detail Modal */}
      {selectedShow && (
        <ShowDetailModal
          showId={selectedShow}
          onClose={() => setSelectedShow(null)}
        />
      )}
    </div>
  );
}
