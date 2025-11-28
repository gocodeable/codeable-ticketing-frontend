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
                <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-border/40 dark:border-border/60">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20">
                        <FolderKanban className="w-4 h-4 text-primary dark:text-primary/90" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">Projects</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {isCurrentUser ? "Your active projects" : "Active projects"}
                        </p>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map((project,i) => (
                   <ProjectCard key={project._id} project={project} i={i}/>
                ))}
            </div>
        </div>
    )
}