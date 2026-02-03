"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserSelector, UserSuggestion } from "@/components/UserSelector";
import { MemberRole } from "@/types/project";
import { getRoleColor, getRoleLabel, hasAdminPermissions } from "@/utils/roleUtils";
import { apiPatch } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { toast } from "sonner";
import { Trash2, Loader2, Users, UserPlus, Crown, Server, Monitor, Palette, Bug, UserX, Briefcase } from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn, getAvatarUrl } from "@/lib/utils";

type MembersModalType = "project" | "team";

interface BaseMember {
  uid?: string;
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  updatedAt?: string;
  role?: MemberRole;
}

interface MemberWithAdmin extends BaseMember {
  isAdmin: boolean;
}

interface NewMemberWithRole extends UserSuggestion {
  role: MemberRole;
}

interface MembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MembersModalType;
  resourceId: string;
  resourceName: string;
  members: BaseMember[];
  adminIds: string[];
  onSuccess: () => void;
  apiEndpoint: string;
  successMessage: string;
  errorMessage: string;
}

export function MembersModal({
  open,
  onOpenChange,
  type,
  resourceId,
  resourceName,
  members: initialMembers,
  adminIds: initialAdminIds,
  onSuccess,
  apiEndpoint,
  successMessage,
  errorMessage,
}: MembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithAdmin[]>([]);
  const [newMembers, setNewMembers] = useState<NewMemberWithRole[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize members
  useEffect(() => {
    if (open && initialMembers) {
      const membersWithAdmin: MemberWithAdmin[] = initialMembers.map((member) => {
        const memberId = member.uid || member.id || "";
        const isAdmin = initialAdminIds.includes(memberId);
        // For projects: PM also has admin permissions
        // For teams: Only admin has admin permissions
        const effectiveIsAdmin = type === "project" 
          ? (isAdmin || member.role === "pm")
          : isAdmin;
        
        return {
          ...member,
          uid: member.uid || member.id || "",
          id: member.id || member.uid || "",
          isAdmin: effectiveIsAdmin,
          role: member.role || "unassigned",
        };
      });
      
      setMembers(membersWithAdmin);
      setNewMembers([]);
      setHasChanges(false);
    }
  }, [open, initialMembers, initialAdminIds, type]);

  const handleRoleChange = (memberId: string, newRole: MemberRole) => {
    const member = members.find((m) => (m.uid || m.id) === memberId);
    
    // For projects: Check if trying to change the last admin/PM's role away from admin/PM
    if (type === "project") {
      if (member?.isAdmin && !hasAdminPermissions(newRole)) {
        const adminPmCount = members.filter((m) => hasAdminPermissions(m.role as MemberRole)).length;
        if (adminPmCount === 1) {
          toast.error("Cannot change the last admin/PM's role. At least one member must remain an admin or PM.");
          return;
        }
      }
    } else {
      // For teams: Check if trying to change the last admin's role away from admin
      if (member?.isAdmin && newRole !== "admin") {
        const adminCount = members.filter((m) => m.role === "admin").length;
        if (adminCount === 1) {
          toast.error("Cannot change the last admin's role. At least one member must remain an admin.");
          return;
        }
      }
    }

    setMembers((prev) =>
      prev.map((member) => {
        if ((member.uid || member.id) === memberId) {
          // For projects: admin or PM role gives admin status
          // For teams: only admin role gives admin status
          const isAdmin = type === "project"
            ? (newRole === "admin" || newRole === "pm")
            : (newRole === "admin");
          return { ...member, role: newRole, isAdmin };
        }
        return member;
      })
    );
    setHasChanges(true);
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find((m) => (m.uid || m.id) === memberId);
    
    if (type === "project") {
      if (member?.isAdmin || member?.role === "pm") {
        const adminPmCount = members.filter((m) => m.isAdmin || m.role === "pm").length;
        if (adminPmCount === 1) {
          toast.error("Cannot remove the last admin/PM from the project");
          return;
        }
      }
    } else {
      // For teams: check if removing the last admin
      if (member?.role === "admin") {
        const adminCount = members.filter((m) => m.role === "admin").length;
        if (adminCount === 1) {
          toast.error("Cannot remove the last admin from the team");
          return;
        }
      }
    }
    
    setMembers((prev) => prev.filter((member) => (member.uid || member.id) !== memberId));
    setHasChanges(true);
  };

  const handleAddMembers = (users: UserSuggestion[]) => {
    const newMembersWithRole: NewMemberWithRole[] = users.map((user) => {
      const existingMember = newMembers.find((m) => m.uid === user.uid);
      return {
        ...user,
        role: existingMember?.role || ("unassigned" as MemberRole),
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

    // Collect all admin UIDs
    let allAdminUids: string[] = [];
    
    if (type === "project") {
      // For projects: admin or PM role gives admin status
      const existingAdminUids = members
        .filter((m) => m.isAdmin || m.role === "admin" || m.role === "pm")
        .map((m) => m.uid || m.id || "");
      
      const newAdminUids = newMembers
        .filter((m) => m.role === "admin" || m.role === "pm")
        .map((m) => m.uid);
      
      allAdminUids = [...existingAdminUids, ...newAdminUids];
      
      if (allAdminUids.length === 0) {
        toast.error("At least one member must remain an admin or PM. Please assign admin or PM role to at least one member.");
        return;
      }
    } else {
      // For teams: only admin role gives admin status
      const existingAdminUids = members
        .filter((m) => m.role === "admin")
        .map((m) => m.uid || m.id || "");
      
      const newAdminUids = newMembers
        .filter((m) => m.role === "admin")
        .map((m) => m.uid);
      
      allAdminUids = [...existingAdminUids, ...newAdminUids];

      if (allAdminUids.length === 0) {
        toast.error("At least one member must remain an admin. Please assign admin role to at least one member.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();

      // Combine existing members (minus removed ones) with new members
      const allMemberUids = [
        ...members.map((m) => m.uid || m.id || ""),
        ...newMembers.map((m) => m.uid),
      ];

      // Build memberRoles array
      const memberRoles = [
        ...members.map((member) => ({
          uid: member.uid || member.id || "",
          role: member.role || "unassigned",
        })),
        ...newMembers.map((member) => ({
          uid: member.uid,
          role: member.role,
        })),
      ];

      const payload: any = {
        members: allMemberUids,
        memberRoles: memberRoles,
      };

      if (type === "project") {
        payload.admin = allAdminUids;
      } else {
        payload.admin = allAdminUids;
      }

      const response = await apiPatch(
        `${apiEndpoint}?id=${resourceId}`,
        payload,
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success(successMessage);
        onSuccess();
        onOpenChange(false);
        setHasChanges(false);
      } else {
        toast.error(data.error || errorMessage);
      }
    } catch (error) {
      console.error("Error updating members:", error);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter out already added members from UserSelector
  const existingMemberUids = members.map((m) => m.uid || m.id || "");
  const filteredNewMembers = newMembers.filter(
    (m) => !existingMemberUids.includes(m.uid)
  );
  
  // Convert to UserSuggestion[] for UserSelector (without role)
  const newMembersForSelector: UserSuggestion[] = filteredNewMembers.map(({ role, ...member }) => member);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl min-w-[min(90vw,20rem)] h-[75vh] max-h-[95vh] sm:min-w-md md:min-w-lg p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Manage Members
              </DialogTitle>
              <DialogDescription className="text-sm">
                Add, remove, or change roles for {type === "project" ? "project" : "team"} members
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 px-6 py-4 overflow-hidden">
          {/* Add New Members Section */}
          <div className="space-y-2 shrink-0 mb-3">
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
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between shrink-0 mb-2">
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
              <div className="text-center py-8 rounded-lg border border-dashed border-border/50 bg-muted/20 flex-1 flex items-center justify-center">
                <div>
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No members yet. Add members using the search above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
                {members.map((member) => {
                  const memberId = member.uid || member.id || "";
                  return (
                    <div
                      key={memberId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        member.role === "admin"
                          ? "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200/50 dark:border-yellow-800/30"
                          : "bg-card border-border/50 hover:bg-muted/50 hover:border-border"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "relative h-10 w-10 rounded-full overflow-hidden ring-2 shrink-0",
                        member.role === "admin" ? "ring-yellow-400/50" : "ring-border"
                      )}>
                        <Image
                          src={getAvatarUrl(member.avatar, member.updatedAt) || DEFAULT_AVATAR}
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

                      {/* Role Selector and Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={member.role || "unassigned"}
                          onValueChange={(value) =>
                            handleRoleChange(memberId, value as MemberRole)
                          }
                        >
                          <SelectTrigger className={cn(
                            "min-w-[120px] max-w-[140px] h-8 text-xs border-border/50",
                            member.role === "admin" && "border-yellow-300/50 dark:border-yellow-700/50"
                          )}>
                            <SelectValue>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  getRoleColor(member.role)
                                )} />
                                <span className="truncate">
                                  {getRoleLabel(member.role)}
                                </span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", getRoleColor("unassigned"))} />
                                <UserX className="w-3 h-3 text-muted-foreground" />
                                Unassigned
                              </div>
                            </SelectItem>
                            <SelectItem value="backend">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", getRoleColor("backend"))} />
                                <Server className="w-3 h-3 text-muted-foreground" />
                                Backend
                              </div>
                            </SelectItem>
                            <SelectItem value="frontend">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", getRoleColor("frontend"))} />
                                <Monitor className="w-3 h-3 text-muted-foreground" />
                                Frontend
                              </div>
                            </SelectItem>
                            <SelectItem value="ui">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", getRoleColor("ui"))} />
                                <Palette className="w-3 h-3 text-muted-foreground" />
                                UI
                              </div>
                            </SelectItem>
                            <SelectItem value="qa">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", getRoleColor("qa"))} />
                                <Bug className="w-3 h-3 text-muted-foreground" />
                                QA
                              </div>
                            </SelectItem>
                            <SelectItem value="pm">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", getRoleColor("pm"))} />
                                <Briefcase className="w-3 h-3 text-muted-foreground" />
                                Project Manager
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", getRoleColor("admin"))} />
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
                          onClick={() => handleRemoveMember(memberId)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          disabled={
                            type === "project"
                              ? (member.isAdmin || member.role === "pm") && members.filter((m) => m.isAdmin || m.role === "pm").length === 1
                              : member.role === "admin" && members.filter((m) => m.role === "admin").length === 1
                          }
                          title={
                            type === "project"
                              ? (member.isAdmin || member.role === "pm") && members.filter((m) => m.isAdmin || m.role === "pm").length === 1
                                ? "Cannot remove the last admin/PM"
                                : "Remove member"
                              : member.role === "admin" && members.filter((m) => m.role === "admin").length === 1
                                ? "Cannot remove the last admin"
                                : "Remove member"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Members Preview */}
          {filteredNewMembers.length > 0 && (
            <div className="space-y-3 shrink-0 mt-5">
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
                        src={getAvatarUrl(member.avatar, (member as BaseMember).updatedAt) || DEFAULT_AVATAR}
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
                        value={member.role || "unassigned"}
                        onValueChange={(value) =>
                          handleNewMemberRoleChange(member.uid, value as MemberRole)
                        }
                      >
                        <SelectTrigger className={cn(
                          "min-w-[120px] max-w-[140px] h-8 text-xs border-border/50",
                          member.role === "admin" && "border-yellow-300/50 dark:border-yellow-700/50"
                        )}>
                          <SelectValue>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                getRoleColor(member.role)
                              )} />
                              <span className="truncate">
                                {getRoleLabel(member.role)}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", getRoleColor("unassigned"))} />
                              <UserX className="w-3 h-3 text-muted-foreground" />
                              Unassigned
                            </div>
                          </SelectItem>
                          <SelectItem value="backend">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", getRoleColor("backend"))} />
                              <Server className="w-3 h-3 text-muted-foreground" />
                              Backend
                            </div>
                          </SelectItem>
                          <SelectItem value="frontend">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", getRoleColor("frontend"))} />
                              <Monitor className="w-3 h-3 text-muted-foreground" />
                              Frontend
                            </div>
                          </SelectItem>
                          <SelectItem value="ui">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", getRoleColor("ui"))} />
                              <Palette className="w-3 h-3 text-muted-foreground" />
                              UI
                            </div>
                          </SelectItem>
                          <SelectItem value="qa">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", getRoleColor("qa"))} />
                              <Bug className="w-3 h-3 text-muted-foreground" />
                              QA
                            </div>
                          </SelectItem>
                          <SelectItem value="pm">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", getRoleColor("pm"))} />
                              <Briefcase className="w-3 h-3 text-muted-foreground" />
                              Project Manager
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", getRoleColor("admin"))} />
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

