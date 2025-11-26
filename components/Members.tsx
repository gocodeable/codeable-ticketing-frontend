import { TeamMember } from "@/types/team";
import MemberGallery from "./MemberGallery";

interface MembersProps {
  members: TeamMember[];
  adminList?: string[];
  showOnlyAdminBadge?: boolean;
}

export function Members({ members, adminList, showOnlyAdminBadge = false }: MembersProps) {
  return (
    <div className="w-full h-full overflow-visible flex flex-col">
      <MemberGallery 
        members={members} 
        adminList={adminList}
        showOnlyAdminBadge={showOnlyAdminBadge}
      />
    </div>
  );
}
