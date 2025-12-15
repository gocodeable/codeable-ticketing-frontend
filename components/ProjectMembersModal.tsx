"use client";

import { useMemo } from "react";
import { Project, ProjectMember } from "@/types/project";
import { MembersModal } from "./MembersModal";

interface ProjectMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess: () => void;
}

export function ProjectMembersModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectMembersModalProps) {
  // Don't render if project is not available
  if (!project) {
    return null;
  }

  // Convert project members to base member format
  const members = useMemo(() => {
    const projectMembers = Array.isArray(project.members)
      ? project.members.filter((m): m is ProjectMember => typeof m !== "string")
      : [];
    
    return projectMembers.map((member) => ({
      uid: member.uid,
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      role: member.role,
    }));
  }, [project.members]);

  return (
    <MembersModal
      open={open}
      onOpenChange={onOpenChange}
      type="project"
      resourceId={project._id}
      resourceName={project.title}
      members={members}
      adminIds={project.admin || []}
      onSuccess={onSuccess}
      apiEndpoint="/project/api"
      successMessage="Project members updated successfully"
      errorMessage="Failed to update project members"
    />
  );
}

