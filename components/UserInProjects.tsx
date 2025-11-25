import { apiGet } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useState, useEffect } from "react";
import { Project as ProjectType } from "@/types/project";
import { Projects } from "./Projects";
import { ProjectsSkeleton } from "./ProjectCardSkeleton";

interface UserInProjectsProps {
  uid: string;
}
export function UserInProjects({ uid }: UserInProjectsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setProjects([]);
        return;
      }
      
      const idToken = await user.getIdToken();
      
      const response = await apiGet(`/projects/api?uid=${uid}`, idToken);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data || []);
      } else {
        console.error("Failed to fetch projects", data.error);
        setError(data.error || "Failed to fetch projects");
        setProjects([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch projects", error);
      setError(error.message || "Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, uid]);
  
  if (loading) {
    return <ProjectsSkeleton count={3} />;
  }
  
  if (error) {
    return null;
  }
  
  return projects && projects.length > 0 ? (
    <Projects projects={projects} />
  ) : null;
}
