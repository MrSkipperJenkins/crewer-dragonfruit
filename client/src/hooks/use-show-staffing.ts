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
  // Query crew assignments for all shows
  const crewAssignmentQueries = useQuery({
    queryKey: [`/api/crew-assignments-batch`, showIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const showId of showIds) {
        try {
          const response = await fetch(`/api/shows/${showId}/crew-assignments`);
          if (response.ok) {
            results[showId] = await response.json();
          } else {
            results[showId] = [];
          }
        } catch {
          results[showId] = [];
        }
      }
      return results;
    },
    enabled: showIds.length > 0,
  });

  // Query required jobs for all shows
  const requiredJobQueries = useQuery({
    queryKey: [`/api/required-jobs-batch`, showIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const showId of showIds) {
        try {
          const response = await fetch(`/api/shows/${showId}/required-jobs`);
          if (response.ok) {
            results[showId] = await response.json();
          } else {
            results[showId] = [];
          }
        } catch {
          results[showId] = [];
        }
      }
      return results;
    },
    enabled: showIds.length > 0,
  });

  // Function to get crew staffing status for a show
  const getCrewStaffingStatus = (showId: string): ShowStaffingStatus => {
    const showRequiredJobs = requiredJobQueries.data?.[showId] || [];
    const showCrewAssignments = crewAssignmentQueries.data?.[showId] || [];

    const totalRequired = showRequiredJobs.length;

    // Count assignments by status
    const confirmed = showCrewAssignments.filter(
      (ca: any) => ca.status === "confirmed",
    ).length;
    const pending = showCrewAssignments.filter(
      (ca: any) => ca.status === "pending",
    ).length;
    const declined = showCrewAssignments.filter(
      (ca: any) => ca.status === "declined",
    ).length;

    // Total assigned is any crew member assigned regardless of status
    const totalAssigned = showCrewAssignments.length;

    return {
      assigned: totalAssigned,
      required: totalRequired,
      isFullyStaffed: confirmed >= totalRequired,
      pending,
      declined,
      confirmed,
    };
  };

  return {
    crewAssignmentQueries,
    requiredJobQueries,
    getCrewStaffingStatus,
    isLoading: crewAssignmentQueries.isLoading || requiredJobQueries.isLoading,
  };
}
