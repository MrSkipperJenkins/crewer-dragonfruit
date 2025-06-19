import { useQuery } from "@tanstack/react-query";

export interface ShowStaffingStatus {
  assigned: number;
  required: number;
  isFullyStaffed: boolean;
  pending: number;
  declined: number;
  confirmed: number;
}

export function useShowStaffing(showIds: string[]) {
  // Helper function to extract actual show ID from virtual recurring event IDs
  const getActualShowId = (showId: string): string => {
    return showId.includes('-') && showId.split('-').length > 5 
      ? showId.split('-').slice(0, -1).join('-') 
      : showId;
  };

  // Get unique actual show IDs for database queries
  const actualShowIds = Array.from(new Set(showIds.map(getActualShowId)));

  // Query crew assignments for all shows
  const crewAssignmentQueries = useQuery({
    queryKey: [`/api/crew-assignments-batch`, actualShowIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const actualShowId of actualShowIds) {
        try {
          const response = await fetch(`/api/shows/${actualShowId}/crew-assignments`);
          if (response.ok) {
            results[actualShowId] = await response.json();
          } else {
            results[actualShowId] = [];
          }
        } catch {
          results[actualShowId] = [];
        }
      }
      return results;
    },
    enabled: actualShowIds.length > 0,
  });

  // Query required jobs for all shows
  const requiredJobQueries = useQuery({
    queryKey: [`/api/required-jobs-batch`, actualShowIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const actualShowId of actualShowIds) {
        try {
          const response = await fetch(`/api/shows/${actualShowId}/required-jobs`);
          if (response.ok) {
            results[actualShowId] = await response.json();
          } else {
            results[actualShowId] = [];
          }
        } catch {
          results[actualShowId] = [];
        }
      }
      return results;
    },
    enabled: actualShowIds.length > 0,
  });

  // Function to get crew staffing status for a show
  const getCrewStaffingStatus = (showId: string): ShowStaffingStatus => {
    const actualShowId = getActualShowId(showId);
    const showRequiredJobs = requiredJobQueries.data?.[actualShowId] || [];
    const showCrewAssignments = crewAssignmentQueries.data?.[actualShowId] || [];
    
    const totalRequired = showRequiredJobs.length;
    
    // Count assignments by status
    const confirmed = showCrewAssignments.filter((ca: any) => ca.status === 'confirmed').length;
    const pending = showCrewAssignments.filter((ca: any) => ca.status === 'pending').length;
    const declined = showCrewAssignments.filter((ca: any) => ca.status === 'declined').length;
    
    // Total assigned is any crew member assigned regardless of status
    const totalAssigned = showCrewAssignments.length;
    
    return {
      assigned: totalAssigned,
      required: totalRequired,
      isFullyStaffed: confirmed >= totalRequired,
      pending,
      declined,
      confirmed
    };
  };

  return {
    crewAssignmentQueries,
    requiredJobQueries,
    getCrewStaffingStatus,
    isLoading: crewAssignmentQueries.isLoading || requiredJobQueries.isLoading
  };
}