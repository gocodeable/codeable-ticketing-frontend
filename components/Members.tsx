import { TeamMember } from "@/types/team";
import MemberGallery from "./MemberGallery";

interface MembersProps {
  members: TeamMember[];
}

export function Members({ members }: MembersProps) {
  console.log(members);
  return (
    <div className="w-full h-full overflow-visible flex flex-col">
      <MemberGallery members={members} />
    </div>
  );
}
