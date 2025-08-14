import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, UserX, Search, Link } from "lucide-react";
import type { CrewMember, User } from "@shared/schema";

// Mock current user - in real app, this would come from auth context
const currentUser: User = {
  id: "18658ee4-f93f-4246-9ea6-9aa7a7fc1286",
  email: "test@example.com",
  name: "Test User",
  avatar: null,
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock current workspace - in real app, this would come from context
const currentWorkspaceId = "6589830e-c1a0-47a7-ac33-936358cffaee";

export default function LinkCrewMemberProfile() {
  const [searchEmail, setSearchEmail] = useState(currentUser.email);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's current crew member profiles
  const { data: userCrewMembers = [], isLoading: loadingUserProfiles } = useQuery<CrewMember[]>({
    queryKey: [`/api/users/${currentUser.id}/crew-members`],
  });

  // Search for unlinked crew members by email
  const { data: availableProfiles = [], refetch: searchProfiles, isFetching: searching } = useQuery<CrewMember[]>({
    queryKey: [`/api/workspaces/${currentWorkspaceId}/unlinked-crew-members`, searchEmail],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${currentWorkspaceId}/unlinked-crew-members?email=${encodeURIComponent(searchEmail)}`);
      if (!response.ok) throw new Error("Failed to search profiles");
      return response.json();
    },
    enabled: false, // Only search when explicitly requested
  });

  // Link crew member to user mutation
  const linkProfileMutation = useMutation({
    mutationFn: async (crewMemberId: string) => {
      const response = await apiRequest("POST", `/api/crew-members/${crewMemberId}/link-user`, {
        userId: currentUser.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Linked",
        description: "Your crew member profile has been successfully linked to your account.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/crew-members`] });
      searchProfiles(); // Refresh search results
    },
    onError: (error) => {
      console.error("Error linking profile:", error);
      toast({
        title: "Link Failed",
        description: "Failed to link crew member profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unlink crew member from user mutation
  const unlinkProfileMutation = useMutation({
    mutationFn: async (crewMemberId: string) => {
      const response = await apiRequest("POST", `/api/crew-members/${crewMemberId}/unlink-user`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Unlinked",
        description: "Crew member profile has been unlinked from your account.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/crew-members`] });
    },
    onError: (error) => {
      console.error("Error unlinking profile:", error);
      toast({
        title: "Unlink Failed",
        description: "Failed to unlink crew member profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchEmail.trim()) {
      searchProfiles();
    }
  };

  const handleLinkProfile = (crewMemberId: string) => {
    linkProfileMutation.mutate(crewMemberId);
  };

  const handleUnlinkProfile = (crewMemberId: string) => {
    unlinkProfileMutation.mutate(crewMemberId);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Crew Member Profile</h1>
        <p className="text-muted-foreground">
          Link your user account to existing crew member profiles to see your schedules and assignments.
        </p>
      </div>

      {/* Current Linked Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Your Linked Profiles
          </CardTitle>
          <CardDescription>
            Crew member profiles currently linked to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUserProfiles ? (
            <div className="text-center py-4">Loading your profiles...</div>
          ) : userCrewMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No crew member profiles linked to your account yet.</p>
              <p className="text-sm">Search below to find and link existing profiles.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userCrewMembers.map((crewMember: CrewMember) => (
                <Card key={crewMember.id} className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {crewMember.firstName} {crewMember.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{crewMember.email}</p>
                        {crewMember.phone && (
                          <p className="text-sm text-muted-foreground">{crewMember.phone}</p>
                        )}
                        <Badge variant="outline" className="mt-2">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Linked
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUnlinkProfile(crewMember.id)}
                        disabled={unlinkProfileMutation.isPending}
                      >
                        Unlink
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search for Available Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Profile
          </CardTitle>
          <CardDescription>
            Search for existing crew member profiles to link to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="search-email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="search-email"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter email address to search for profiles"
                  className="flex-1"
                />
                <Button type="submit" disabled={searching || !searchEmail.trim()}>
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </form>

          {availableProfiles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-4">Available Profiles</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {availableProfiles.map((crewMember: CrewMember) => (
                  <Card key={crewMember.id} className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {crewMember.firstName} {crewMember.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{crewMember.email}</p>
                          {crewMember.phone && (
                            <p className="text-sm text-muted-foreground">{crewMember.phone}</p>
                          )}
                          <Badge variant="outline" className="mt-2">
                            <UserX className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLinkProfile(crewMember.id)}
                          disabled={linkProfileMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Link className="h-4 w-4" />
                          Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {availableProfiles.length === 0 && searchEmail && !searching && (
            <div className="mt-6 text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No unlinked crew member profiles found for "{searchEmail}"</p>
              <p className="text-sm">
                Try a different email address or contact your production manager to create a profile.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}