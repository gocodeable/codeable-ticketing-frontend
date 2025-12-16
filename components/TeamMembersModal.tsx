"use client";

import { useMemo } from "react";
import { Team, TeamMember } from "@/types/team";
import { MembersModal } from "./MembersModal";

interface TeamMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onSuccess: () => void;
}

export function TeamMembersModal({
  open,
  onOpenChange,
  team,
  onSuccess,
}: TeamMembersModalProps) {
  // Don't render if team is not available
  if (!team) {
    return null;
  }

  // Convert team members to base member format
  const members = useMemo(() => {
    return team.members.map((member) => ({
      uid: member.id || (member as any).uid || "",
      id: member.id || (member as any).uid || "",
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      role: member.role,
    }));
  }, [team.members]);

  return (
    <MembersModal
      open={open}
      onOpenChange={onOpenChange}
      type="team"
      resourceId={team._id}
      resourceName={team.name}
      members={members}
      adminIds={team.admin || []}
      onSuccess={onSuccess}
      apiEndpoint="/team/api"
      successMessage="Team members updated successfully"
      errorMessage="Failed to update team members"
    />
  );
}

