"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import { FileText } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { Briefcase } from "lucide-react";
import { Users } from "lucide-react";
import { List } from "lucide-react";
import { Crown } from "lucide-react";
import { Code } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IssueStatusPieChart } from "@/components/IssueStatusPieChart";
import { IssuePriorityBarChart } from "@/components/IssuePriorityBarChart";
import { WorkloadDistribution } from "@/components/WorkloadDistribution";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiGet } from "@/lib/api/apiClient";
import { Issue } from "@/types/issue";
import { WorkflowStatus } from "@/types/workflowStatus";
import { getAvatarUrl } from "@/lib/utils";

interface ProjectInfoProps {
  project: Project;
  isAdmin?: boolean;
}

export default function ProjectInfo({ project, isAdmin }: ProjectInfoProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);

  // Fetch issues data
  useEffect(() => {
    let isMounted = true;
    
    const fetchChartData = async () => {
      if (!user || !project._id) return;

      try {
        setLoadingCharts(true);
        const idToken = await user.getIdToken();

        // Fetch workflow statuses and issues in parallel
        const [statusesRes, issuesRes] = await Promise.all([
          apiGet(`/api/workflow-statuses/${project._id}`, idToken),
          apiGet(`/api/issues?projectId=${project._id}&limit=1000&skip=0`, idToken),
        ]);

        const [statusesData, issuesData] = await Promise.all([
          statusesRes.json(),
          issuesRes.json(),
        ]);

        // Only update state if component is still mounted
        if (!isMounted) return;

        if (statusesData.success) {
          setStatuses(statusesData.data || []);
        } else {
          setStatuses([]);
        }

        if (issuesData.success) {
          setIssues(issuesData.data || []);
        } else {
          setIssues([]);
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        if (isMounted) {
          setStatuses([]);
          setIssues([]);
        }
      } finally {
        if (isMounted) {
          setLoadingCharts(false);
        }
      }
    };

    fetchChartData();

    return () => {
      isMounted = false;
    };
  }, [project._id, user]);
  // Get admin members from the members array
  const adminMembers = Array.isArray(project.members)
    ? project.members.filter((member: any) => {
        if (typeof member === 'string') {
          return project.admin?.includes(member);
        }
        return project.admin?.includes(member.uid);
      })
    : [];

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Project Information
        </h2>
      </div>

      <div className="space-y-5">
        {/* Analytics Section - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Issues by Status Pie Chart */}
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Issues by Status
              </h3>
            </div>
            <IssueStatusPieChart issues={issues} statuses={statuses} loading={loadingCharts} />
          </div>

          {/* Issues by Priority Bar Chart */}
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Issues by Priority
              </h3>
            </div>
            <IssuePriorityBarChart issues={issues} loading={loadingCharts} />
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Project Code
            </h3>
          </div>
          <p className="text-lg font-mono font-bold text-primary pl-6">
            {project.code}
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Description
            </h3>
          </div>
          <div className="pl-6">
            {project.description ? (
              <div
                className="text-sm sm:text-base text-foreground leading-relaxed project-description-content"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                No description provided
              </p>
            )}
            <style jsx global>{`
              .project-description-content {
                word-wrap: break-word;
              }
              .project-description-content p {
                margin: 0.5rem 0;
                color: hsl(var(--foreground));
              }
              .project-description-content p:first-child {
                margin-top: 0;
              }
              .project-description-content p:last-child {
                margin-bottom: 0;
              }
              .project-description-content img {
                max-width: 100%;
                height: auto;
                border-radius: 0.375rem;
                margin: 0.5rem 0;
                cursor: pointer;
                transition: opacity 0.2s;
              }
              .project-description-content img:hover {
                opacity: 0.8;
              }
              .project-description-content ul,
              .project-description-content ol {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
                color: hsl(var(--foreground));
                list-style-position: outside;
              }
              .project-description-content ul {
                list-style-type: disc;
              }
              .project-description-content ol {
                list-style-type: decimal;
              }
              .project-description-content ul li,
              .project-description-content ol li {
                color: hsl(var(--foreground));
                display: list-item;
              }
              .project-description-content ul li::marker,
              .project-description-content ol li::marker {
                color: hsl(var(--foreground));
              }
              .project-description-content a {
                color: hsl(var(--primary));
                text-decoration: underline;
              }
              .project-description-content a:hover {
                color: hsl(var(--primary) / 0.8);
              }
              .project-description-content h1,
              .project-description-content h2,
              .project-description-content h3 {
                margin: 1rem 0 0.5rem 0;
                font-weight: 600;
                color: hsl(var(--foreground));
              }
              .project-description-content h1 {
                font-size: 1.5rem;
              }
              .project-description-content h2 {
                font-size: 1.25rem;
              }
              .project-description-content h3 {
                font-size: 1.125rem;
              }
            `}</style>
          </div>
        </div>

        {/* External Links Section */}
        {(project.figmaLink || project.swaggerLink || project.devDocsLink || project.prodDocsLink) && (
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                External Links
              </h3>
            </div>
            <div className="space-y-2 pl-6">
              {project.figmaLink && (
                <a
                  href={project.figmaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:bg-accent rounded-lg p-2.5 -ml-2 transition-all w-fit group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm border">
                    <Image
                      src="/figma.png"
                      alt="Figma"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base text-foreground font-medium group-hover:text-primary transition-colors">
                      Figma Design
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </a>
              )}
              
              {/* Legacy Swagger Link – show as Swagger PROD docs */}
              {project.swaggerLink && !project.docsType && (
                <a
                  href={project.swaggerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:bg-accent rounded-lg p-2.5 -ml-2 transition-all w-fit group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm border">
                    <Image
                      src="/swagger.png"
                      alt="Swagger"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base text-foreground font-medium group-hover:text-primary transition-colors">
                      Swagger - PROD docs
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </a>
              )}

              {/* New Documentation Links with Type */}
              {project.docsType && (
                <>
                  {project.devDocsLink && (
                    <a
                      href={project.devDocsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:bg-accent rounded-lg p-2.5 -ml-2 transition-all w-fit group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm border">
                        <Image
                          src={project.docsType === "firebase" ? "/firebase.png" : "/swagger.png"}
                          alt={project.docsType === "firebase" ? "Firebase" : "Swagger"}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base text-foreground font-medium group-hover:text-primary transition-colors">
                          {project.docsType === "firebase" ? "Firebase" : "Swagger"} - DEV docs
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </a>
                  )}
                  {project.prodDocsLink && (
                    <a
                      href={project.prodDocsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:bg-accent rounded-lg p-2.5 -ml-2 transition-all w-fit group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm border">
                        <Image
                          src={project.docsType === "firebase" ? "/firebase.png" : "/swagger.png"}
                          alt={project.docsType === "firebase" ? "Firebase" : "Swagger"}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base text-foreground font-medium group-hover:text-primary transition-colors">
                          {project.docsType === "firebase" ? "Firebase" : "Swagger"} - PROD docs
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Created
              </h3>
            </div>
            <p className="text-sm font-medium text-foreground pl-6">
              {project.createdAt
                ? new Date(project.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Unknown"}
            </p>
          </div>

          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <List className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Issues
              </h3>
            </div>
            <p className="text-sm font-medium text-foreground pl-6">
              {project.issueCount !== undefined
                ? `${project.issueCount} issue${
                    project.issueCount !== 1 ? "s" : ""
                  }`
                : "0 issues"}
            </p>
          </div>

          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Members
              </h3>
            </div>
            <p className="text-sm font-medium text-foreground pl-6">
              {Array.isArray(project.members)
                ? `${project.members.length} member${
                    project.members.length !== 1 ? "s" : ""
                  }`
                : "0 members"}
            </p>
          </div>

          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Team
              </h3>
            </div>
            {project.team ? (
              <Link
                href={`/team/${project.team._id}`}
                className="flex items-center gap-2 pl-6 hover:text-primary transition-colors w-fit group"
              >
                {project.team.img ? (
                  <Image
                    src={project.team.img}
                    alt={project.team.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-3 h-3 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[100px]">
                  {project.team.name}
                </span>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground pl-6">
                No team
              </p>
            )}
          </div>
        </div>

        {/* Workload Distribution and Project Admins - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Workload Distribution Section */}
          <WorkloadDistribution 
            issues={issues} 
            members={project.members} 
            loading={loadingCharts} 
          />

          {/* Project Admins Section */}
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  Project Admins
                </h3>
              </div>
              {adminMembers.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {adminMembers.length} admin{adminMembers.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {adminMembers.length > 0 ? (
              <div className="space-y-2">
                {adminMembers.map((member: any, index: number) => (
                  <Link
                    key={typeof member === 'string' ? member : member.uid || index}
                    href={`/profile/${typeof member === 'string' ? member : member.uid}`}
                    className="flex items-center gap-3 hover:bg-accent rounded-lg p-2.5 -ml-1 transition-all w-full group"
                  >
                    <Avatar className="w-10 h-10 ring-2 ring-yellow-500/30 shadow-sm">
                      <AvatarImage
                        src={typeof member === 'string' ? '' : getAvatarUrl(member.avatar, member.updatedAt) || ''}
                        alt={typeof member === 'string' ? 'Admin' : member.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-medium">
                        {typeof member === 'string' ? (
                          <Crown className="w-4 h-4" />
                        ) : (
                          getInitials(member.name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {typeof member === 'string' ? 'Admin User' : member.name}
                      </span>
                      {typeof member !== 'string' && member.email && (
                        <span className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </span>
                      )}
                    </div>
                    <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No admins assigned
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
