import { TeamMember } from "@/types/team";
import MemberGallery from "./MemberGallery";

interface MembersProps {
  members: TeamMember[];
  adminList?: string[];
  showOnlyAdminBadge?: boolean;
}

export function Members({ members, adminList = [], showOnlyAdminBadge = false }: MembersProps) {
  const adminMembers = members.filter((member) => {
    return adminList.includes(member.id) || member.role === "admin";
  });

  const nonAdminMembers = members.filter((member) => {
    return !adminList.includes(member.id) && member.role !== "admin";
  });

  return (
    <div className="w-full h-full overflow-visible flex flex-col gap-5">
      {/* Admin Members Carousel */}
      {adminMembers.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
            <span className="text-yellow-500">Admins</span>
            <span className="text-muted-foreground">({adminMembers.length})</span>
          </h3>
          <div className="h-full">
            <MemberGallery 
              members={adminMembers} 
              adminList={adminList}
              showOnlyAdminBadge={showOnlyAdminBadge}
            />
          </div>
        </div>
      )}

      {/* Non-Admin Members Carousel */}
      {nonAdminMembers.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
            <span>Members</span>
            <span className="text-muted-foreground">({nonAdminMembers.length})</span>
          </h3>
          <div className="h-full">
            <MemberGallery 
              members={nonAdminMembers} 
              adminList={adminList}
              showOnlyAdminBadge={showOnlyAdminBadge}
            />
          </div>
        </div>
      )}

      {/* Empty State - only show if both are empty */}
      {adminMembers.length === 0 && nonAdminMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No members found.
          </p>
        </div>
      )}
    </div>
  );
}
