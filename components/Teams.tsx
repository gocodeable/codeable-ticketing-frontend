import { Team as TeamType } from "@/types/team"
import TeamCard  from "@/components/TeamCard"

interface TeamsProps{
    teams: TeamType[]
    type: "workingIn" | "myTeams"
}

export function Teams({teams, type}: TeamsProps) {
    // Don't render if there are no teams
    if (!teams || teams.length === 0) {
        return null;
    }
    
    return (
        <div className="w-full max-w-full overflow-hidden">
            <h2 className="text-lg font-medium mb-4">
                {type === "workingIn" ? "Working In" : "My Teams"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team, i) => (
                   <TeamCard key={team._id} team={team} i={i}/>
                ))} 
            </div>
        </div>
    )
}