import { Team as TeamType } from "@/types/team"
import TeamCard  from "@/components/TeamCard"
import { Users, Briefcase } from "lucide-react"

interface TeamsProps{
    teams: TeamType[]
    type: "workingIn" | "myTeams" | "userInTeams"
    isCurrentUser?: boolean
}

export function Teams({teams, type, isCurrentUser = true}: TeamsProps) {
    // Don't render if there are no teams
    if (!teams || teams.length === 0) {
        return null;
    }

    const getSectionIcon = () => {
        switch(type) {
            case "myTeams":
                return <Users className="w-4 h-4 text-primary dark:text-primary/90" />;
            case "workingIn":
                return <Briefcase className="w-4 h-4 text-primary dark:text-primary/90" />;
            default:
                return <Users className="w-4 h-4 text-primary dark:text-primary/90" />;
        }
    };

    const getSectionTitle = () => {
        switch(type) {
            case "myTeams":
                return "My Teams";
            case "workingIn":
                return "Working In";
            default:
                return "In Teams";
        }
    };

    const getSectionDescription = () => {
        switch(type) {
            case "myTeams":
                return "Teams you created and manage";
            case "workingIn":
                return "Teams you're a member of";
            default:
                return isCurrentUser ? "Teams you're part of" : "Teams they're part of";
        }
    };

    return (
        <div className="w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-border/40 dark:border-border/60">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20">
                    {getSectionIcon()}
                </div>
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {getSectionTitle()}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {getSectionDescription()}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.map((team, i) => (
                   <TeamCard key={team._id} team={team} i={i}/>
                ))}
            </div>
        </div>
    )
}