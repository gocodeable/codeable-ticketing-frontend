import { Project as ProjectType } from "@/types/project"
import ProjectCard  from "@/components/ProjectCard"
import { FolderKanban } from "lucide-react"

interface ProjectsProps{
    projects:ProjectType[]
    showTitle?: boolean
    isCurrentUser?: boolean
}
export function Projects({projects, showTitle = true, isCurrentUser = true}:ProjectsProps) {
    return (
        <div className="w-full max-w-full overflow-hidden">
            {showTitle && (
                <div className="flex items-start gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 mt-1">
                        <FolderKanban className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Projects</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isCurrentUser ? "Your active projects" : "Active projects"}
                        </p>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {projects.map((project,i) => (
                   <ProjectCard key={project._id} project={project} i={i}/>
                ))}
            </div>
        </div>
    )
}