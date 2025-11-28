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
                return <Users className="w-5 h-5 text-primary" />;
            case "workingIn":
                return <Briefcase className="w-5 h-5 text-primary" />;
            default:
                return <Users className="w-5 h-5 text-primary" />;
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
            <div className="flex items-start gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 mt-1">
                    {getSectionIcon()}
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {getSectionTitle()}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {getSectionDescription()}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {teams.map((team, i) => (
                   <TeamCard key={team._id} team={team} i={i}/>
                ))}
            </div>
        </div>
    )
}