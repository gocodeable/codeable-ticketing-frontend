"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useEffect, useState } from "react";
import { Team as TeamType } from "@/types/team";
import { EmptyComponent } from "@/components/Empty";
import { Teams } from "@/components/Teams";
import { TeamsSkeleton } from "@/components/TeamCardSkeleton";
import { apiGet } from "@/lib/api/apiClient";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type AllTeams = {
  workingIn: TeamType[];
  myTeams: TeamType[];
};
export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<AllTeams>({ workingIn: [], myTeams: [] });
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiGet(`/teams/api?uid=${user.uid}`, idToken);
      const data = await response.json();

      if (data.success) {
        const teamsData: TeamType[] = data.data || [];
        // Separate teams where user is admin vs just a member
        const myTeams = teamsData.filter((team) =>
          team.admin?.includes(user.uid)
        );
        const workingIn = teamsData.filter(
          (team) => !team.admin?.includes(user.uid)
        );
        setTeams({ workingIn, myTeams });
      } else {
        setTeams({ workingIn: [], myTeams: [] });
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      setTeams({ workingIn: [], myTeams: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  const hasTeams = teams.workingIn?.length > 0 || teams.myTeams?.length > 0;

  return (
    <div className="w-full min-h-screen min-w-0 bg-background font-sans bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background">
      <main className="w-full max-w-7xl mx-auto flex flex-col items-start justify-start gap-y-6 sm:gap-y-8 py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 lg:px-8">
        {hasTeams && (
          <div className="w-full flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Teams</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Collaborate with your team members on projects
              </p>
            </div>
            <Link href="/teams/create">
              <Button
                size="default"
                className="gap-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Team</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        )}
        {loading ? (
          <div className="w-full flex flex-col gap-y-8">
            <TeamsSkeleton count={3} />
            <TeamsSkeleton count={3} />
          </div>
        ) : hasTeams ? (
          <div className="w-full flex flex-col gap-y-10">
            <Teams type="workingIn" teams={teams.workingIn} />
            <Teams type="myTeams" teams={teams.myTeams} />
          </div>
        ) : (
          <div className="w-full overflow-hidden flex items-center justify-center min-h-[60vh]">
            <EmptyComponent type="team" />
          </div>
        )}
      </main>
    </div>
  );
}
