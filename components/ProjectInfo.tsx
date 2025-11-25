import { Project } from "@/types/project";
import { FileText } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { Briefcase } from "lucide-react";
import { Link } from "lucide-react";
import Image from "next/image";
import { Users } from "lucide-react";
import { List } from "lucide-react";
import { Crown } from "lucide-react";
import { Code } from "lucide-react";

export default function ProjectInfo({ project }: { project: Project }) {
  return (
    <div className="w-full bg-card rounded-lg border shadow-sm p-4 sm:p-6">
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-6">
        Project Information
      </h2>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Project Code
            </h3>
          </div>
          <p className="text-sm sm:text-base font-mono font-semibold text-primary pl-6">
            {project.code}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Description
            </h3>
          </div>
          <p className="text-sm sm:text-base text-foreground pl-6">
            {project.description || "No description provided"}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Created
            </h3>
          </div>
          <p className="text-sm sm:text-base text-foreground pl-6">
            {project.createdAt
              ? new Date(project.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Unknown"}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Team</h3>
          </div>
          {project.team ? (
            <Link
              href={`/team/${project.team._id}`}
              className="flex items-center gap-3 pl-6 hover:bg-accent rounded-md p-2 -ml-2 transition-colors w-fit"
            >
              {project.team.img ? (
                <Image
                  src={project.team.img}
                  alt={project.team.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
              )}
              <span className="text-sm sm:text-base text-foreground font-medium hover:text-primary transition-colors">
                {project.team.name}
              </span>
            </Link>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground pl-6">
              No team assigned
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <List className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Issues
            </h3>
          </div>
          <p className="text-sm sm:text-base text-foreground pl-6">
            {project.issueCount !== undefined
              ? `${project.issueCount} issue${
                  project.issueCount !== 1 ? "s" : ""
                }`
              : "0 issues"}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Team Members
            </h3>
          </div>
          <p className="text-sm sm:text-base text-foreground pl-6">
            {Array.isArray(project.members)
              ? `${project.members.length} member${
                  project.members.length !== 1 ? "s" : ""
                }`
              : "0 members"}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Project Admins
            </h3>
          </div>
          <p className="text-sm sm:text-base text-foreground pl-6">
            {project.admin && project.admin.length > 0
              ? `${project.admin.length} admin${
                  project.admin.length !== 1 ? "s" : ""
                }`
              : "No admins"}
          </p>
        </div>
      </div>
    </div>
  );
}
