import { Project as ProjectType } from "@/types/project"
import ProjectCard  from "@/components/ProjectCard"
interface ProjectsProps{
    projects:ProjectType[]
    showTitle?: boolean
}
export function Projects({projects, showTitle = true}:ProjectsProps) {
    return (
        <div className="w-full max-w-full overflow-hidden">
            {showTitle && <h2 className="text-lg font-medium mb-4">Projects</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project,i) => (
                   <ProjectCard key={project._id} project={project} i={i}/>
                ))} 
            </div>
        </div>
    )
}