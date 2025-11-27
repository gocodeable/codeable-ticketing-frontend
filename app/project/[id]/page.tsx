"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  Star,
  Info,
  List,
  LayoutDashboard,
  Users,
  Settings,
  Crown,
} from "lucide-react";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ProjectPageSkeleton } from "@/components/ProjectPageSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet } from "@/lib/api/apiClient";
import { Members } from "@/components/Members";
import ProjectInfo from "@/components/ProjectInfo";
import ProjectBoard from "@/components/ProjectBoard";
import ProjectSettings from "@/components/ProjectSettings";
import { UpdateProjectSheet } from "@/components/UpdateProjectSheet";
import { toast } from "sonner";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { id } = use(params);
  const fetchProject = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!id || id === "null" || id === "undefined") {
        setError("Invalid project ID");
        setIsLoading(false);
        return;
      }

      if (!user) {
        setError("Please log in to view this project");
        setIsLoading(false);
        return;
      }

      const idToken = await user.getIdToken();
      const response = await apiGet(`/project/api?id=${id}`, idToken);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch project");
      }

      const data = await response.json();
      setProject(data.project);
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load project. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchProject();
  }, [id, user]);

  const handleUpdateSuccess = () => {
    toast.success("Project updated successfully");
    fetchProject();
  };

  if (isLoading) {
    return <ProjectPageSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-semibold mb-2">Error Loading Project</h2>
          <p className="text-muted-foreground mb-6">
            {error || "Project not found"}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user && project.admin.includes(user.uid);
  
  // Get user's role from project memberRoles or members array
  const getUserRole = (): "admin" | "developer" | "qa" | undefined => {
    if (!user) return undefined;
    
    // Check if user is admin first
    if (isAdmin) return "admin";
    
    // Check memberRoles array for role
    if (Array.isArray(project.members)) {
      const member = project.members.find((m: any) => 
        typeof m === 'string' ? m === user.uid : m.uid === user.uid
      );
      
      if (member && typeof member !== 'string' && member.role) {
        return member.role as "admin" | "developer" | "qa";
      }
    }
    
    return "developer"; // default role
  };
  
  const userRole = getUserRole();

  return (
    <div className="w-full min-w-0 bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background min-h-screen">
      <main className="w-full mx-auto flex flex-col items-start justify-start gap-y-3 sm:gap-y-4 py-4 sm:py-8 md:py-12 lg:py-16 px-3 sm:px-4 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 sm:mb-4 cursor-pointer -ml-2 sm:ml-0"
            size="sm"
          >
            <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="text-sm sm:text-base">Back</span>
          </Button>
        </motion.div>

        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-sm p-3 sm:p-4 md:p-6 w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <Image
                src={project.img}
                alt={project.title}
                width={100}
                height={100}
                className="w-8 h-8 sm:w-12 sm:h-12 md:w-28 md:h-28 object-contain rounded-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">
                  {project.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs sm:text-sm font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {project.code}
                  </span>
                  {isAdmin && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Admin
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full">
            <Tabs defaultValue="board" className="w-full">
              <TabsList className="w-full sm:w-fit justify-start overflow-x-auto gap-1 sm:gap-2 h-auto p-1">
                <TabsTrigger value="info" className="shrink-0 px-2 py-1">
                  <Info className="w-4 h-4" />
                  <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">
                    Info
                  </p>
                </TabsTrigger>
                <TabsTrigger value="issues" className="shrink-0 px-2 py-1">
                  <List className="w-4 h-4" />
                  <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">
                    Issues{" "}
                    {project.issueCount !== undefined &&
                      `(${project.issueCount})`}
                  </p>
                </TabsTrigger>
                <TabsTrigger value="board" className="shrink-0 px-2 py-1">
                  <LayoutDashboard className="w-4 h-4" />
                  <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">
                    Board
                  </p>
                </TabsTrigger>
                <TabsTrigger value="members" className="shrink-0 px-2 py-1">
                  <Users className="w-4 h-4" />
                  <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">
                    Members{" "}
                    {Array.isArray(project.members) &&
                      `(${project.members.length})`}
                  </p>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="settings" className="shrink-0 px-2 py-1">
                    <Settings className="w-4 h-4" />
                    <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">
                      Settings
                    </p>
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="info" className="w-full mt-3 sm:mt-4">
                <ProjectInfo 
                  project={project} 
                  isAdmin={!!isAdmin}
                  onEdit={() => setIsUpdateSheetOpen(true)}
                />
              </TabsContent>
              <TabsContent value="issues" className="mt-3 sm:mt-4">
                <div className="w-full">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                    Issues
                  </h2>
                </div>
              </TabsContent>
              <TabsContent value="board" className="mt-3 sm:mt-4">
                <ProjectBoard 
                  projectId={id} 
                  isAdmin={!!isAdmin} 
                  userRole={userRole}
                  projectMembers={Array.isArray(project.members) ? project.members.map((m: any) => ({
                    uid: m.uid,
                    name: m.name,
                    email: m.email,
                    avatar: m.avatar,
                    role: m.role,
                  })) : []}
                />
              </TabsContent>
              <TabsContent
                value="members"
                className="flex-1 mt-3 sm:mt-4 overflow-visible flex flex-col"
              >
                <div className="w-full h-full bg-card rounded-lg border shadow-sm p-4 sm:p-6 overflow-visible flex flex-col">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-4">
                    Project Members
                  </h2>
                  <div className="flex-1 min-h-0">
                    {Array.isArray(project.members) &&
                    project.members.length > 0 ? (
                      <Members
                        members={project.members.map((m: any) => ({
                          id: m.uid,
                          name: m.name,
                          email: m.email,
                          avatar: m.avatar,
                          role: m.role,
                        }))}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          No Members Yet
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Add members to this project to get started.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              {isAdmin && (
                <TabsContent value="settings" className="mt-3 sm:mt-4">
                  <ProjectSettings project={project} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </motion.div>
      </main>

      {/* Update Project Sheet */}
      {project && (
        <UpdateProjectSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          project={project}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
