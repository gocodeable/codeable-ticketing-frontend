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
import { TeamMembersModal } from "@/components/TeamMembersModal";
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
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
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
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Team</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "Team not found"}
          </p>
          <Button onClick={() => router.back()} className="rounded-lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user && team.admin.includes(user.uid);

  return (
    <div className="w-full min-w-0 bg-background min-h-screen">
      <main className="w-full h-full max-w-7xl mx-auto flex flex-col items-start justify-start gap-y-4 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 hover:bg-muted/50 cursor-pointer rounded-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </motion.div>

        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-card rounded-xl border border-border/40 dark:border-border/70 shadow-sm p-5 sm:p-6 w-full">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
              {team.img ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-muted/50 border border-border/40">
                  <Image
                    src={team.img}
                    alt={team.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0 border border-border/40">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {team.name}
                </h1>
                {isAdmin && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                      <Crown className="w-3 h-3 text-yellow-600 dark:text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-500">Admin</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="w-full flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="w-full h-full flex flex-col overflow-visible">
            <Tabs defaultValue="members" className="w-full h-full flex flex-col overflow-visible">
              <TabsList className="w-full sm:w-fit justify-start overflow-x-auto h-10 bg-muted/60">
                <TabsTrigger value="info" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-sm">Info</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-sm">Members</span>
                  <span className="text-xs text-muted-foreground">({team.members.length})</span>
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-sm">Projects</span>
                  {!isLoadingProjects && <span className="text-xs text-muted-foreground">({projects.length})</span>}
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-sm">Settings</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="info" className="w-full flex-1 mt-3.5 overflow-y-auto">
                <div className="w-full h-full bg-card rounded-xl border border-border/40 dark:border-border/70 shadow-sm p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Team Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Description
                      </h3>
                      {team.description ? (
                        <div
                          className="text-sm text-foreground leading-relaxed team-description-content"
                          dangerouslySetInnerHTML={{ __html: team.description }}
                        />
                      ) : (
                        <p className="text-sm text-foreground leading-relaxed">
                          No description provided
                        </p>
                      )}
                      <style jsx global>{`
                        .team-description-content {
                          word-wrap: break-word;
                        }
                        .team-description-content p {
                          margin: 0.5rem 0;
                          color: hsl(var(--foreground));
                        }
                        .team-description-content p:first-child {
                          margin-top: 0;
                        }
                        .team-description-content p:last-child {
                          margin-bottom: 0;
                        }
                        .team-description-content img {
                          max-width: 100%;
                          height: auto;
                          border-radius: 0.375rem;
                          margin: 0.5rem 0;
                          cursor: pointer;
                          transition: opacity 0.2s;
                        }
                        .team-description-content img:hover {
                          opacity: 0.8;
                        }
                        .team-description-content ul,
                        .team-description-content ol {
                          margin: 0.5rem 0;
                          padding-left: 1.5rem;
                          color: hsl(var(--foreground));
                        }
                        .team-description-content ul li,
                        .team-description-content ol li {
                          color: hsl(var(--foreground));
                        }
                        .team-description-content ul li::marker,
                        .team-description-content ol li::marker {
                          color: hsl(var(--foreground));
                        }
                        .team-description-content a {
                          color: hsl(var(--primary));
                          text-decoration: underline;
                        }
                        .team-description-content a:hover {
                          color: hsl(var(--primary) / 0.8);
                        }
                        .team-description-content h1,
                        .team-description-content h2,
                        .team-description-content h3 {
                          margin: 1rem 0 0.5rem 0;
                          font-weight: 600;
                          color: hsl(var(--foreground));
                        }
                        .team-description-content h1 {
                          font-size: 1.5rem;
                        }
                        .team-description-content h2 {
                          font-size: 1.25rem;
                        }
                        .team-description-content h3 {
                          font-size: 1.125rem;
                        }
                      `}</style>
                    </div>
                    <div className="border-t border-border/40 dark:border-border/60 pt-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Created
                      </h3>
                      <p className="text-sm text-foreground">
                        {team.createdAt
                          ? new Date(team.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members" className="flex-1 mt-3.5 overflow-visible flex flex-col">
                <div className="w-full h-full bg-card rounded-xl border border-border/40 dark:border-border/70 shadow-sm p-5 sm:p-6 overflow-visible flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      Team Members
                    </h2>
                    {isAdmin && team && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsMembersModalOpen(true);
                        }}
                        className="shrink-0 z-10 relative rounded-lg gap-2"
                        type="button"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit Members</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 min-h-0">
                    <Members
                      members={team.members}
                      adminList={team.admin}
                      showOnlyAdminBadge={true}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="flex-1 mt-3.5 overflow-y-auto">
                <div className="w-full h-full bg-card rounded-xl border border-border/40 dark:border-border/70 shadow-sm p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Projects
                  </h2>
                  {isLoadingProjects ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <ProjectCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : projects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {projects.map((project, index) => (
                        <ProjectCard key={project._id} project={project} i={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                        <FolderKanban className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-1">
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
                <TabsContent value="settings" className="flex-1 mt-3.5 overflow-y-auto">
                  <div className="w-full h-full bg-card rounded-xl border border-border/40 dark:border-border/70 shadow-sm p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-5">
                      Team Settings
                    </h2>

                    <div className="space-y-5">
                      {/* Update Team Section */}
                      <div className="space-y-3 pb-5 border-b border-border/40 dark:border-border/60">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            Update Team
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Update your team's image, name, and description
                          </p>
                        </div>
                        <Button
                          onClick={() => setIsUpdateSheetOpen(true)}
                          variant="outline"
                          className="gap-2 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Update Team
                        </Button>
                      </div>

                      {/* Danger Zone */}
                      <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
                        <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Danger Zone
                        </h3>

                        <div className="space-y-3">
                          <p className="text-xs text-foreground/80">
                            Permanently delete this team and all associated Projects and Issues. This action cannot be undone.
                          </p>
                          <Button
                            onClick={() => setShowDeleteDialog(true)}
                            variant="destructive"
                            size="sm"
                            className="gap-2 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Team Members Modal */}
      {team && (
        <TeamMembersModal
          open={isMembersModalOpen}
          onOpenChange={(open) => {
            setIsMembersModalOpen(open);
          }}
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

