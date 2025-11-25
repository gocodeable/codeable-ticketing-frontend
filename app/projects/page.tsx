"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useEffect, useState } from "react";
import { Project as ProjectType } from "@/types/project";
import { EmptyComponent } from "@/components/Empty";
import { Projects } from "@/components/Projects";
import { ProjectsSkeleton } from "@/components/ProjectCardSkeleton";
import { apiGet } from "@/lib/api/apiClient";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiGet(`/projects/api?uid=${user.uid}`, idToken);
      const data = await response.json();
      if (data.success) {
        setProjects(data.data || []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);
  const hasProjects = projects && projects.length > 0;

   return (
     <div className="w-full min-h-screen min-w-0 bg-background font-sans bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background">
      <main className="w-full mx-auto flex flex-col items-start justify-start gap-y-8 py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        {hasProjects && (
          <div className="w-full flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Projects
            </h1>
            <Link href="/projects/create">
              <Button size="default" className="gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Project</span>
              </Button>
            </Link>
          </div>
        )}
        {loading ? (
          <ProjectsSkeleton count={5} />
        ) : hasProjects ? (
           <Projects projects={projects} showTitle={false} />
        ) : (
          <div className="w-full overflow-hidden flex items-center justify-center">
            <EmptyComponent type="project" />
          </div>
        )}
      </main>
    </div>
  );
}
