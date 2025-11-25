import { apiGet } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useState, useEffect } from "react";
import { Team as TeamType } from "@/types/team";
import { Teams } from "./Teams";
import { TeamsSkeleton } from "./TeamCardSkeleton";

interface UserInTeamsProps {
  uid: string;
}

export function UserInTeams({ uid }: UserInTeamsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamType[]>([]);
  
  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setTeams([]);
        return;
      }
      
      const idToken = await user.getIdToken();
      
      const response = await apiGet(`/teams/api?uid=${uid}`, idToken);
      const data = await response.json();
      
      if (data.success) {
        setTeams(data.data || []);
      } else {
        console.error("Failed to fetch teams", data.error);
        setError(data.error || "Failed to fetch teams");
        setTeams([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch teams", error);
      setError(error.message || "Failed to fetch teams");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user, uid]);
  
  if (loading) {
    return <TeamsSkeleton count={3} />;
  }
  
  if (error) {
    return null;
  }
  
  return teams && teams.length > 0 ? (
    <Teams teams={teams} type="userInTeams" />
  ) : null;
}