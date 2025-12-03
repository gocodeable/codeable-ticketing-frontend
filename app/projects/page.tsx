"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Project as ProjectType } from "@/types/project";
import { EmptyComponent } from "@/components/Empty";
import { Projects } from "@/components/Projects";
import { ProjectsSkeleton } from "@/components/ProjectCardSkeleton";
import ProjectCard from "@/components/ProjectCard";
import { apiGet, apiDelete } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { Plus, Search, Pin, FolderKanban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { motion } from "framer-motion";

const INITIAL_LIMIT = 20;
const LOAD_MORE_LIMIT = 20;

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [pinnedProjects, setPinnedProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedLoading, setPinnedLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);
  const skipRef = useRef(0);

  const fetchProjects = useCallback(async (isInitial = false, skip = 0) => {
    if (!user) return;

    if (isInitial) {
      setLoading(true);
      skipRef.current = 0;
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const idToken = await user.getIdToken();
      const limit = isInitial ? INITIAL_LIMIT : LOAD_MORE_LIMIT;
      const response = await apiGet(
        `/projects/api?uid=${user.uid}&limit=${limit}&skip=${skip}`,
        idToken
      );
      const data = await response.json();
      if (data.success) {
        const newProjects = data.data || [];
        if (isInitial) {
          setProjects(newProjects);
        } else {
          setProjects((prev) => [...prev, ...newProjects]);
        }
        setHasMore(data.pagination?.hasMore ?? false);
        skipRef.current = skip + newProjects.length;
      } else {
        if (isInitial) {
          setProjects([]);
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      if (isInitial) {
        setProjects([]);
        setHasMore(false);
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [user]);

  const fetchPinnedProjects = async () => {
    if (!user) return;

    setPinnedLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiGet(`/api/pinned-projects`, idToken);
      const data = await response.json();
      if (data.success) {
        setPinnedProjects(data.data || []);
      } else {
        setPinnedProjects([]);
      }
    } catch (error) {
      console.error("Error fetching pinned projects:", error);
      setPinnedProjects([]);
    } finally {
      setPinnedLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(true, 0);
    fetchPinnedProjects();
  }, [user]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    // Don't set up observer if searching or already loading
    if (searchQuery.trim() || loading || loadingMore || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && !searchQuery.trim()) {
          const currentSkip = skipRef.current;
          fetchProjects(false, currentSkip);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, searchQuery, fetchProjects]);

  const handleUnpin = async (projectId: string) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pinned-projects/${projectId}`;
      const response = await apiDelete(apiUrl, idToken);

      if (response.ok) {
        // Remove from pinned projects list
        setPinnedProjects((prev) => prev.filter((p) => p._id !== projectId));
        toast.success("Project unpinned");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unpin project");
      }
    } catch (err) {
      console.error("Error unpinning project:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to unpin project"
      );
    }
  };

  // When searching, we need to fetch all projects (no pagination)
  const [allProjectsForSearch, setAllProjectsForSearch] = useState<ProjectType[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchAllProjectsForSearch = async () => {
      if (!user || !searchQuery.trim()) {
        setAllProjectsForSearch([]);
        return;
      }

      setSearchLoading(true);
      try {
        const idToken = await user.getIdToken();
        // Fetch a large number for search (or all if needed)
        const response = await apiGet(
          `/projects/api?uid=${user.uid}&limit=1000&skip=0`,
          idToken
        );
        const data = await response.json();
        if (data.success) {
          setAllProjectsForSearch(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching projects for search:", error);
        setAllProjectsForSearch([]);
      } finally {
        setSearchLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchAllProjectsForSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }
    const query = searchQuery.toLowerCase().trim();
    const projectsToSearch = allProjectsForSearch.length > 0 ? allProjectsForSearch : projects;
    return projectsToSearch.filter((project) =>
      project.title.toLowerCase().includes(query)
    );
  }, [projects, searchQuery, allProjectsForSearch]);

  const filteredPinnedProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return pinnedProjects;
    }
    const query = searchQuery.toLowerCase().trim();
    return pinnedProjects.filter((project) =>
      project.title.toLowerCase().includes(query)
    );
  }, [pinnedProjects, searchQuery]);

  const regularProjects = useMemo(() => {
    const pinnedIds = new Set(pinnedProjects.map((p) => p._id));
    return filteredProjects.filter((p) => !pinnedIds.has(p._id));
  }, [filteredProjects, pinnedProjects]);

  const hasProjects = (projects && projects.length > 0) || (pinnedProjects && pinnedProjects.length > 0);
  const hasPinnedProjects = pinnedProjects && pinnedProjects.length > 0;

  return (
    <div className="w-full min-h-screen min-w-0 bg-background font-sans">
      <main className="w-full max-w-7xl mx-auto flex flex-col items-start justify-start gap-y-6 sm:gap-y-8 py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 lg:px-8">
        {hasProjects && (
          <motion.div
            className="w-full flex items-center justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Projects</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage and organize your team projects
              </p>
            </div>
            <Link href="/projects/create">
              <Button
                size="default"
                className="gap-2 cursor-pointer rounded-lg bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 hover:shadow-md transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Project</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </motion.div>
        )}
        {hasProjects && (
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
                placeholder="Search projects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full max-w-md"
              />
            </div>
          </motion.div>
        )}
        {loading || pinnedLoading ? (
          <ProjectsSkeleton count={6} />
        ) : hasProjects ? (
          <>
            {/* Pinned Projects Section */}
            {hasPinnedProjects && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-border/40 dark:border-border/60">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20">
                    <Pin className="w-4 h-4 text-yellow-500 dark:text-yellow-500/90" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Pinned Projects</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your frequently accessed projects
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {filteredPinnedProjects.map((project, i) => (
                    <ProjectCard 
                      key={project._id} 
                      project={project} 
                      i={i} 
                      isPinned={true}
                      onUnpin={handleUnpin}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Regular Projects Section */}
            {regularProjects.length > 0 && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: hasPinnedProjects ? 0.1 : 0 }}
              >
                {hasPinnedProjects && (
                  <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-border/40 dark:border-border/60">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20">
                      <FolderKanban className="w-4 h-4 text-primary dark:text-primary/90" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">All Projects</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your active projects
                      </p>
                    </div>
                  </div>
                )}
                <Projects projects={regularProjects} showTitle={!hasPinnedProjects} />
                
                {/* Loading indicator and observer target for infinite scroll */}
                {!searchQuery.trim() && (
                  <>
                    <div ref={observerTarget} className="h-10" />
                    {loadingMore && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading more projects...</span>
                      </div>
                    )}
                    {!hasMore && regularProjects.length >= INITIAL_LIMIT && (
                      <div className="flex items-center justify-center py-8">
                        <span className="text-sm text-muted-foreground">No more projects to load</span>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
            
            {/* Search loading indicator */}
            {searchQuery.trim() && searchLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching projects...</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full overflow-hidden flex items-center justify-center min-h-[60vh]">
            <EmptyComponent type="project" />
          </div>
        )}
      </main>
    </div>
  );
}
