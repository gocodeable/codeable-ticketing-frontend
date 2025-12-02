"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useEffect, useState, useMemo } from "react";
import { Team as TeamType } from "@/types/team";
import { EmptyComponent } from "@/components/Empty";
import { Teams } from "@/components/Teams";
import { TeamsSkeleton } from "@/components/TeamCardSkeleton";
import { apiGet } from "@/lib/api/apiClient";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { motion } from "framer-motion";

type AllTeams = {
  workingIn: TeamType[];
  myTeams: TeamType[];
};
export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<AllTeams>({ workingIn: [], myTeams: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) {
      return teams;
    }
    const query = searchQuery.toLowerCase().trim();
    return {
      workingIn: teams.workingIn.filter((team) =>
        team.name.toLowerCase().includes(query)
      ),
      myTeams: teams.myTeams.filter((team) =>
        team.name.toLowerCase().includes(query)
      ),
    };
  }, [teams, searchQuery]);

  const hasTeams = teams.workingIn?.length > 0 || teams.myTeams?.length > 0;

  return (
    <div className="w-full min-h-screen min-w-0 bg-background">
      <main className="w-full max-w-7xl mx-auto flex flex-col items-start justify-start gap-y-8 lg:gap-y-10 py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        {hasTeams && (
          <motion.div
            className="w-full flex items-center justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Teams</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Collaborate with your team members on projects
              </p>
            </div>
            <Link href="/teams/create">
              <Button
                size="default"
                className="gap-2 cursor-pointer rounded-lg bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 hover:shadow-md transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Team</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </motion.div>
        )}
        {hasTeams && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search teams by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full max-w-md"
              />
            </div>
          </motion.div>
        )}
        {loading ? (
          <div className="w-full flex flex-col gap-y-12">
            <TeamsSkeleton count={3} type="workingIn" />
            <TeamsSkeleton count={3} type="myTeams" />
          </div>
        ) : hasTeams ? (
          <motion.div
            className="w-full flex flex-col gap-y-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Teams type="workingIn" teams={filteredTeams.workingIn} />
            <Teams type="myTeams" teams={filteredTeams.myTeams} />
          </motion.div>
        ) : (
          <div className="w-full overflow-hidden flex items-center justify-center min-h-[60vh]">
            <EmptyComponent type="team" />
          </div>
        )}
      </main>
    </div>
  );
}
