import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useShowStaffing } from "@/hooks/use-show-staffing";
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
  ChevronDownIcon,
  ChevronUpIcon,
  Users
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";

import CrewStaffingModal from "@/components/shows/crew-staffing-modal";

type SortField = "title" | "datetime" | "status" | "category";
type SortDirection = "asc" | "desc";

export default function ShowsListView() {
  const { currentWorkspace } = useCurrentWorkspace();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [crewStaffingShow, setCrewStaffingShow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("datetime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);

  // Date range for fetching calendar data (show next 6 months of events)
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1); // Include past month
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 12); // Include next year

  // Fetch all show instances including recurring events from calendar API
  const { data: allShows = [], isLoading } = useQuery({
    queryKey: [`/api/calendar`, startDate.toISOString(), endDate.toISOString(), currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const response = await fetch(`/api/calendar?start=${startDate.toISOString()}&end=${endDate.toISOString()}&workspaceId=${currentWorkspace.id}`);
      if (!response.ok) throw new Error('Failed to fetch shows');
      return response.json();
    },
    enabled: !!currentWorkspace?.id,
  });

  // Fetch show categories for each show
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-categories`],
    enabled: !!currentWorkspace?.id,
  });

  // Fetch show category assignments
  const { data: categoryAssignments = [] } = useQuery({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/show-category-assignments`],
    enabled: !!currentWorkspace?.id,
  });

  // Helper function to get actual show ID (parent ID for virtual recurring events)
  const getActualShowId = (showId: string): string => {
    return showId.includes('-') && showId.split('-').length > 5 
      ? showId.split('-').slice(0, -1).join('-') 
      : showId;
  };

  // Get unique actual show IDs for staffing data
  const showIds = Array.from(new Set((allShows as any[]).map((show: any) => getActualShowId(show.id))));
  const { getCrewStaffingStatus } = useShowStaffing(showIds);

  // Function to get show category
  const getShowCategory = (showId: string) => {
    const actualShowId = getActualShowId(showId);
    const assignment = (categoryAssignments as any[])?.find(
      (ca: any) => ca.showId === actualShowId
    );
    
    if (!assignment) return null;
    
    return (categories as any[])?.find(
      (c: any) => c.id === assignment.categoryId
    );
  };

  // Helper function to handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort shows
  const filteredShows = (allShows as any[]).filter((show: any) => {
    const matchesStatus = statusFilter === "all" || show.status === statusFilter;
    const matchesSearch = !searchQuery || 
      show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (show.description && show.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  }).sort((a: any, b: any) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "datetime":
        aValue = new Date(a.startTime);
        bValue = new Date(b.startTime);
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "category":
        const aCat = getShowCategory(a.id);
        const bCat = getShowCategory(b.id);
        aValue = aCat?.name || "";
        bValue = bCat?.name || "";
        break;
      default:
        aValue = a.startTime;
        bValue = b.startTime;
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Pagination logic
  const totalItems = filteredShows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShows = filteredShows.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortField, sortDirection]);

  // Function to handle row click
  const handleRowClick = (showId: string) => {
    if (currentWorkspace) {
      navigate(`/workspaces/${currentWorkspace.slug}/shows/${showId}/edit`);
    }
  };

  // Function to handle crew staffing click
  const handleCrewStaffingClick = (e: React.MouseEvent, showId: string) => {
    e.stopPropagation(); // Prevent row click
    setCrewStaffingShow(showId);
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
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Show
                      {sortField === "title" && (
                        sortDirection === "asc" ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("datetime")}
                  >
                    <div className="flex items-center gap-1">
                      Date & Time
                      {sortField === "datetime" && (
                        sortDirection === "asc" ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" && (
                        sortDirection === "asc" ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Crew Staffing</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Category
                      {sortField === "category" && (
                        sortDirection === "asc" ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredShows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No shows found
                    </TableCell>
                  </TableRow>
                )}

                {paginatedShows.map((show: any) => {
                  const category = getShowCategory(show.id);
                  const staffingStatus = getCrewStaffingStatus(show.id);
                  return (
                    <TableRow 
                      key={show.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      <TableCell>
                        <div className="font-medium">{formatDate(show.startTime)}</div>
                        <div className="text-sm text-gray-500">
                          {formatTime(show.startTime)} - {formatTime(show.endTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(show.status || 'scheduled')}>
                          {(show.status || 'scheduled').charAt(0).toUpperCase() + (show.status || 'scheduled').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 h-auto p-1 text-left"
                          onClick={(e) => handleCrewStaffingClick(e, show.id)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {staffingStatus.assigned} of {staffingStatus.required} Jobs Assigned
                            </span>
                            {(staffingStatus.pending > 0 || staffingStatus.declined > 0) && (
                              <div className="text-xs space-x-2">
                                {staffingStatus.pending > 0 && (
                                  <span className="text-yellow-600 dark:text-yellow-400">
                                    {staffingStatus.pending} pending
                                  </span>
                                )}
                                {staffingStatus.declined > 0 && (
                                  <span className="text-red-600 dark:text-red-400">
                                    {staffingStatus.declined} declined
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Button>
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} shows
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crew Staffing Modal */}
      {crewStaffingShow && (
        <CrewStaffingModal
          showId={crewStaffingShow}
          onClose={() => setCrewStaffingShow(null)}
        />
      )}
    </div>
  );
}
