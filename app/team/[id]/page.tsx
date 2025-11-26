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
  Users,
  Settings,
  FolderKanban,
  Crown,
  Edit,
  Trash2,
} from "lucide-react";
import { Team } from "@/types/team";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TeamPageSkeleton } from "@/components/TeamPageSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiDelete } from "@/lib/api/apiClient";
import { Members } from "@/components/Members";
import ProjectCard from "@/components/ProjectCard";
import { ProjectCardSkeleton } from "@/components/ProjectCardSkeleton";
import { UpdateTeamSheet } from "@/components/UpdateTeamSheet";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const { id } = use(params);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!id || id === "null" || id === "undefined") {
        setError("Invalid team ID");
        setIsLoading(false);
        return;
      }

      if (!user) {
        setError("Please log in to view this team");
        setIsLoading(false);
        return;
      }

      const idToken = await user.getIdToken();
      const response = await apiGet(`/team/api?id=${id}`, idToken);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch team");
      }

      const data = await response.json();
      setTeam(data.team);
    } catch (err) {
      console.error("Error fetching team:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load team. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamProjects = async () => {
    try {
      setIsLoadingProjects(true);

      if (!id || id === "null" || id === "undefined" || !user) {
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/teams/${id}/projects`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch team projects");
        return;
      }

      const data = await response.json();
      setProjects(data.data || []);
    } catch (err) {
      console.error("Error fetching team projects:", err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchTeamProjects();
  }, [id, user]);

  const handleDeleteTeam = async () => {
    if (!user || !team) return;

    // Verify team name matches
    if (deleteConfirmName !== team.name) {
      toast.error("Team name does not match");
      return;
    }

    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiDelete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/teams/${team._id}`,
        idToken
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete team");
      }

      toast.success("Team deleted successfully");
      router.push("/teams");
    } catch (err) {
      console.error("Error deleting team:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete team"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmName("");
    }
  };

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmName("");
  };

  const handleUpdateSuccess = () => {
    toast.success("Team updated successfully");
    fetchTeam(); // Refresh team data
  };

  if (isLoading) {
    return <TeamPageSkeleton />;
  }

  if (error || !team) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-semibold mb-2">Error Loading Team</h2>
          <p className="text-muted-foreground mb-6">
            {error || "Team not found"}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user && team.admin.includes(user.uid);

  return (
    <div className="w-full min-w-0 bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background min-h-screen">
      <main className="w-full h-full mx-auto flex flex-col items-start justify-start gap-y-3 sm:gap-y-4 py-4 sm:py-8 md:py-12 lg:py-16 px-3 sm:px-4 md:px-8 lg:px-12">

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
          <div className="rounded-sm p-3 sm:p-4 md:p-6 w-full flex items-center justify-between gap-2 overflow-visible">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              {team.img ? (
                <div className="relative w-8 h-8 sm:w-12 sm:h-12 md:w-28 md:h-28 rounded-full overflow-hidden shrink-0 bg-primary/10">
                  <Image 
                    src={team.img} 
                    alt={team.name} 
                    fill
                    className="object-cover" 
                  />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-28 md:h-28 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 md:w-14 md:h-14 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">
                  {team.name}
                </h1>
                {isAdmin && (
                  <div className="flex items-center gap-1 mt-1">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Admin</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button variant="ghost" size="sm" className="cursor-pointer h-8 w-8 sm:h-9 sm:w-9 p-0">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="w-full flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full h-full flex flex-col overflow-visible">
            <Tabs defaultValue="members" className="w-full h-full flex flex-col overflow-visible">
              <TabsList className="w-full sm:w-fit justify-start overflow-x-auto gap-1 sm:gap-2 h-auto p-1">
                <TabsTrigger value="info" className="shrink-0 px-2 py-1">
                  <Info className="w-4 h-4" />
                  <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">Info</p>
                </TabsTrigger>
                <TabsTrigger value="members" className="shrink-0 px-2 py-1">
                  <Users className="w-4 h-4" />
                  <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">
                    Members ({team.members.length})
                  </p>
                </TabsTrigger>
                <TabsTrigger value="projects" className="shrink-0 px-2 py-1">
                  <FolderKanban className="w-4 h-4" />
                  <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">
                    Projects {!isLoadingProjects && `(${projects.length})`}
                  </p>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="settings" className="shrink-0 px-2 py-1">
                    <Settings className="w-4 h-4" />
                    <p className="hidden xs:block sm:block text-xs sm:text-sm font-medium ml-1">Settings</p>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="info" className="w-full flex-1 mt-3 sm:mt-4 overflow-y-auto">
                <div className="w-full h-full bg-card rounded-lg border shadow-sm p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-4">
                    Team Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Description
                      </h3>
                      <p className="text-sm sm:text-base text-foreground">
                        {team.description || "No description provided"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Created
                      </h3>
                      <p className="text-sm sm:text-base text-foreground">
                        {team.createdAt
                          ? new Date(team.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members" className="flex-1 mt-3 sm:mt-4 overflow-visible flex flex-col">
                <div className="w-full h-full bg-card rounded-lg border shadow-sm p-4 sm:p-6 overflow-visible flex flex-col">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-4">
                    Team Members
                  </h2>
                  <div className="flex-1 min-h-0">
                    <Members 
                      members={team.members} 
                      adminList={team.admin}
                      showOnlyAdminBadge={true}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="flex-1 mt-3 sm:mt-4 overflow-y-auto">
                <div className="w-full h-full bg-card rounded-lg border shadow-sm p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-4">
                    Projects
                  </h2>
                  {isLoadingProjects ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <ProjectCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : projects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((project, index) => (
                        <ProjectCard key={project._id} project={project} i={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FolderKanban className="w-16 h-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Projects Yet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Projects assigned to this team will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="settings" className="flex-1 mt-3 sm:mt-4 overflow-y-auto">
                  <div className="w-full h-full bg-card rounded-lg border shadow-sm p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-6">
                      Team Settings
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Update Team Section */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            Update Team
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Update your team's image, name, and description
                          </p>
                        </div>
                        <Button
                          onClick={() => setIsUpdateSheetOpen(true)}
                          variant="outline"
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Update Team
                        </Button>
                      </div>

                      {/* Danger Zone */}
                      <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                        <h3 className="text-sm font-semibold text-destructive mb-3">
                          Danger Zone
                        </h3>
                        
                        <div className="space-y-3">
                          <p className="text-sm">
                            Permanently delete this team and all associated Projects and Issues. This action cannot be undone.
                          </p>
                          <Button
                            onClick={() => setShowDeleteDialog(true)}
                            variant="destructive"
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Team
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </motion.div>
      </main>

      {/* Update Team Sheet */}
      {team && (
        <UpdateTeamSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          team={team}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleDeleteDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Team</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the team
              and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Please type <span className="font-bold text-foreground">{team?.name}</span> to confirm:
              </p>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Enter team name"
                disabled={isDeleting}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteDialogClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={isDeleting || deleteConfirmName !== team?.name}
              className="gap-2"
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Team
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

