"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserSelector, UserSuggestion } from "@/components/UserSelector";
import { Project, ProjectMember, MemberRole } from "@/types/project";
import { apiPatch } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { toast } from "sonner";
import { Trash2, Loader2, Users, UserPlus, Crown, Code, Bug } from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess: () => void;
}

interface MemberWithRole extends ProjectMember {
  isAdmin: boolean;
}

interface NewMemberWithRole extends UserSuggestion {
  role: MemberRole;
}

export function ProjectMembersModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [newMembers, setNewMembers] = useState<NewMemberWithRole[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Don't render if project is not available
  if (!project) {
    return null;
  }

  // Initialize members from project
  useEffect(() => {
    if (project && open) {
      const projectMembers = Array.isArray(project.members)
        ? project.members.filter((m): m is ProjectMember => typeof m !== "string")
        : [];
      
      const membersWithAdmin: MemberWithRole[] = projectMembers.map((member) => ({
        ...member,
        isAdmin: project.admin?.includes(member.uid) || false,
      }));
      
      setMembers(membersWithAdmin);
      setNewMembers([]);
      setHasChanges(false);
    }
  }, [project, open]);

  const handleRoleChange = (uid: string, newRole: MemberRole) => {
    // Check if trying to change the last admin's role away from admin
    const member = members.find((m) => m.uid === uid);
    if (member?.isAdmin && newRole !== "admin") {
      const adminCount = members.filter((m) => m.isAdmin).length;
      if (adminCount === 1) {
        toast.error("Cannot change the last admin's role. At least one member must remain an admin.");
        return;
      }
    }

    setMembers((prev) =>
      prev.map((member) => {
        if (member.uid === uid) {
          // If changing to admin, mark as admin
          // If changing from admin to something else, remove admin status
          const isAdmin = newRole === "admin";
          return { ...member, role: newRole, isAdmin };
        }
        return member;
      })
    );
    setHasChanges(true);
  };

  const handleRemoveMember = (uid: string) => {
    // Don't allow removing if it's the only admin
    const member = members.find((m) => m.uid === uid);
    if (member?.isAdmin) {
      const adminCount = members.filter((m) => m.isAdmin).length;
      if (adminCount === 1) {
        toast.error("Cannot remove the last admin from the project");
        return;
      }
    }
    
    setMembers((prev) => prev.filter((member) => member.uid !== uid));
    setHasChanges(true);
  };

  const handleAddMembers = (users: UserSuggestion[]) => {
    // Convert UserSuggestion to NewMemberWithRole, preserving existing roles
    const newMembersWithRole: NewMemberWithRole[] = users.map((user) => {
      // Check if this user already exists in newMembers to preserve their role
      const existingMember = newMembers.find((m) => m.uid === user.uid);
      return {
        ...user,
        role: existingMember?.role || ("developer" as MemberRole),
      };
    });
    setNewMembers(newMembersWithRole);
    setHasChanges(true);
  };

  const handleNewMemberRoleChange = (uid: string, newRole: MemberRole) => {
    setNewMembers((prev) =>
      prev.map((member) => {
        if (member.uid === uid) {
          return { ...member, role: newRole };
        }
        return member;
      })
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;

    // Collect all admin UIDs from existing members and new members
    const existingAdminUids = members
      .filter((m) => m.isAdmin || m.role === "admin")
      .map((m) => m.uid);
    
    const newAdminUids = newMembers
      .filter((m) => m.role === "admin")
      .map((m) => m.uid);
    
    const allAdminUids = [...existingAdminUids, ...newAdminUids];

    if (allAdminUids.length === 0) {
      toast.error("At least one member must remain an admin. Please assign admin role to at least one member.");
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();

      // Combine existing members (minus removed ones) with new members
      const allMemberUids = [
        ...members.map((m) => m.uid),
        ...newMembers.map((m) => m.uid),
      ];

      // Build memberRoles array
      const memberRoles = [
        ...members.map((member) => ({
          uid: member.uid,
          role: member.role || "developer",
        })),
        ...newMembers.map((member) => ({
          uid: member.uid,
          role: member.role,
        })),
      ];

      const response = await apiPatch(
        `/project/api?id=${project._id}`,
        {
          members: allMemberUids,
          memberRoles: memberRoles,
          admin: allAdminUids,
        },
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Project members updated successfully");
        onSuccess();
        onOpenChange(false);
        setHasChanges(false);
      } else {
        toast.error(data.error || "Failed to update project members");
      }
    } catch (error) {
      console.error("Error updating project members:", error);
      toast.error("Failed to update project members");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter out already added members from UserSelector
  const existingMemberUids = members.map((m) => m.uid);
  const filteredNewMembers = newMembers.filter(
    (m) => !existingMemberUids.includes(m.uid)
  );
  
  // Convert to UserSuggestion[] for UserSelector (without role)
  const newMembersForSelector: UserSuggestion[] = filteredNewMembers.map(({ role, ...member }) => member);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl min-w-[min(90vw,20rem)] max-h-[90vh] overflow-y-auto sm:min-w-md md:min-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Manage Members
              </DialogTitle>
              <DialogDescription className="text-sm">
                Add, remove, or change roles for project members
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Add New Members Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Add Members</h3>
            </div>
            <UserSelector
              selectedUsers={newMembersForSelector}
              onUsersChange={handleAddMembers}
              placeholder="Search users by name or email..."
            />
          </div>

          {/* Existing Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Current Members
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs font-medium">
                {members.length} {members.length === 1 ? "member" : "members"}
              </Badge>
            </div>
            {members.length === 0 ? (
              <div className="text-center py-8 rounded-lg border border-dashed border-border/50 bg-muted/20">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No members yet. Add members using the search above.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.uid}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      member.isAdmin
                        ? "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200/50 dark:border-yellow-800/30"
                        : "bg-card border-border/50 hover:bg-muted/50 hover:border-border"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "relative h-10 w-10 rounded-full overflow-hidden ring-2 shrink-0",
                      member.isAdmin ? "ring-yellow-400/50" : "ring-border"
                    )}>
                      <Image
                        src={member.avatar || DEFAULT_AVATAR}
                        alt={member.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    </div>

                    {/* Name and Email */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.name}
                        </p>
                        {member.isAdmin && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 border-yellow-300 dark:border-yellow-700 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                          >
                            <Crown className="w-2.5 h-2.5 mr-0.5" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>

                    {/* Role Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={member.role || "developer"}
                        onValueChange={(value) =>
                          handleRoleChange(member.uid, value as MemberRole)
                        }
                      >
                        <SelectTrigger className={cn(
                          "w-30 h-8 text-xs border-border/50",
                          member.role === "admin" && "border-yellow-300/50 dark:border-yellow-700/50"
                        )}>
                          <SelectValue>
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                member.role === "admin" && "bg-yellow-500",
                                member.role === "qa" && "bg-green-500",
                                (!member.role || member.role === "developer") && "bg-blue-500"
                              )} />
                              <span className="capitalize">
                                {member.role || "developer"}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developer">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <Code className="w-3 h-3 text-muted-foreground" />
                              Developer
                            </div>
                          </SelectItem>
                          <SelectItem value="qa">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              <Bug className="w-3 h-3 text-muted-foreground" />
                              QA
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500" />
                              <Crown className="w-3 h-3 text-muted-foreground" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.uid)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        disabled={member.isAdmin && members.filter((m) => m.isAdmin).length === 1}
                        title={
                          member.isAdmin && members.filter((m) => m.isAdmin).length === 1
                            ? "Cannot remove the last admin"
                            : "Remove member"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Members Preview */}
          {filteredNewMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h3 className="text-sm font-semibold text-foreground">
                    New Members to Add
                  </h3>
                </div>
                <Badge className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0">
                  +{filteredNewMembers.length} new
                </Badge>
              </div>
              <div className="space-y-2">
                {filteredNewMembers.map((member) => (
                  <div
                    key={member.uid}
                    className="flex items-center gap-3 p-3 rounded-lg border border-green-200/50 dark:border-green-800/30 bg-green-50/50 dark:bg-green-950/20"
                  >
                    <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-green-400/50 shrink-0">
                      <Image
                        src={member.avatar || DEFAULT_AVATAR}
                        alt={member.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.name}
                        </p>
                        {member.role === "admin" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 border-yellow-300 dark:border-yellow-700 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                          >
                            <Crown className="w-2.5 h-2.5 mr-0.5" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={member.role || "developer"}
                        onValueChange={(value) =>
                          handleNewMemberRoleChange(member.uid, value as MemberRole)
                        }
                      >
                        <SelectTrigger className={cn(
                          "w-30 h-8 text-xs border-border/50",
                          member.role === "admin" && "border-yellow-300/50 dark:border-yellow-700/50"
                        )}>
                          <SelectValue>
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                member.role === "admin" && "bg-yellow-500",
                                member.role === "qa" && "bg-green-500",
                                (!member.role || member.role === "developer") && "bg-blue-500"
                              )} />
                              <span className="capitalize">
                                {member.role || "developer"}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developer">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <Code className="w-3 h-3 text-muted-foreground" />
                              Developer
                            </div>
                          </SelectItem>
                          <SelectItem value="qa">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              <Bug className="w-3 h-3 text-muted-foreground" />
                              QA
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500" />
                              <Crown className="w-3 h-3 text-muted-foreground" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/20 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || (!hasChanges && filteredNewMembers.length === 0)}
            className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

