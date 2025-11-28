"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserSelector, UserSuggestion } from "@/components/UserSelector";
import { Team, TeamMember } from "@/types/team";
import { apiPatch } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { toast } from "sonner";
import { Trash2, Loader2, Crown } from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";

interface TeamMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onSuccess: () => void;
}

interface MemberWithAdmin extends TeamMember {
  isAdmin: boolean;
}

export function TeamMembersModal({
  open,
  onOpenChange,
  team,
  onSuccess,
}: TeamMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithAdmin[]>([]);
  const [newMembers, setNewMembers] = useState<UserSuggestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Don't render if team is not available
  if (!team) {
    return null;
  }

  // Initialize members from team
  useEffect(() => {
    if (team && open) {
      const membersWithAdmin: MemberWithAdmin[] = team.members.map((member) => ({
        ...member,
        id: member.id || (member as any).uid || "",
        isAdmin: team.admin?.includes(member.id || (member as any).uid || "") || false,
      }));
      
      setMembers(membersWithAdmin);
      setNewMembers([]);
      setHasChanges(false);
    }
  }, [team, open]);

  const handleToggleAdmin = (memberId: string) => {
    // Check if trying to remove the last admin
    const member = members.find((m) => m.id === memberId);
    if (member?.isAdmin) {
      const adminCount = members.filter((m) => m.isAdmin).length;
      if (adminCount === 1) {
        toast.error("Cannot remove the last admin. At least one member must remain an admin.");
        return;
      }
    }

    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, isAdmin: !member.isAdmin }
          : member
      )
    );
    setHasChanges(true);
  };

  const handleRemoveMember = (memberId: string) => {
    // Don't allow removing if it's the only admin
    const member = members.find((m) => m.id === memberId);
    if (member?.isAdmin) {
      const adminCount = members.filter((m) => m.isAdmin).length;
      if (adminCount === 1) {
        toast.error("Cannot remove the last admin from the team");
        return;
      }
    }
    
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
    setHasChanges(true);
  };

  const handleAddMembers = (users: UserSuggestion[]) => {
    setNewMembers(users);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate that at least one admin remains
    const adminUids = members
      .filter((m) => m.isAdmin)
      .map((m) => m.id);

    if (adminUids.length === 0) {
      toast.error("At least one member must remain an admin. Please assign admin status to at least one member.");
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();

      // Combine existing members (minus removed ones) with new members
      const allMemberUids = [
        ...members.map((m) => m.id),
        ...newMembers.map((m) => m.uid),
      ];

      const response = await apiPatch(
        `/team/api?id=${team._id}`,
        {
          members: allMemberUids,
          admin: adminUids,
        },
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Team members updated successfully");
        onSuccess();
        onOpenChange(false);
        setHasChanges(false);
      } else {
        toast.error(data.error || "Failed to update team members");
      }
    } catch (error) {
      console.error("Error updating team members:", error);
      toast.error("Failed to update team members");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter out already added members from UserSelector
  const existingMemberIds = members.map((m) => m.id);
  const filteredNewMembers = newMembers.filter(
    (m) => !existingMemberIds.includes(m.uid)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl min-w-[min(90vw,20rem)] max-h-[90vh] overflow-y-auto sm:min-w-[28rem] md:min-w-[32rem]">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
          <DialogDescription>
            Add, remove, or change admin status for team members. Changes will be saved when you click Save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Add New Members Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Add Members</h3>
            <UserSelector
              selectedUsers={filteredNewMembers}
              onUsersChange={handleAddMembers}
              placeholder="Search users by name or email..."
            />
          </div>

          {/* Existing Members List */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Current Members ({members.length})
            </h3>
            {members.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                <p>No members yet. Add members using the search above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-border shrink-0">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <Image
                          src={DEFAULT_AVATAR}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      )}
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
                            className="text-xs px-1.5 py-0.5 border-yellow-200 dark:border-yellow-800 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          >
                            <Crown className="w-2.5 h-2.5 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      )}
                    </div>

                    {/* Admin Toggle and Remove Button */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {/* Admin Toggle */}
                      <Toggle
                        pressed={member.isAdmin}
                        onPressedChange={() => handleToggleAdmin(member.id)}
                        disabled={
                          member.isAdmin &&
                          members.filter((m) => m.isAdmin).length === 1
                        }
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 px-2 text-xs"
                        title={
                          member.isAdmin &&
                          members.filter((m) => m.isAdmin).length === 1
                            ? "Cannot remove the last admin"
                            : "Toggle admin status"
                        }
                      >
                        <Crown className="w-3 h-3" />
                        Admin
                      </Toggle>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                New Members to Add ({filteredNewMembers.length})
              </h3>
              <div className="space-y-2">
                {filteredNewMembers.map((member) => (
                  <div
                    key={member.uid}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-border shrink-0">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <Image
                          src={DEFAULT_AVATAR}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border-border"
                    >
                      Member
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2 sm:pt-0">
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
            className="w-full sm:w-auto"
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

