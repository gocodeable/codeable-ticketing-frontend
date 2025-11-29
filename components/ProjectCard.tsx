import { Card, CardContent } from "./ui/card";
import { Project as ProjectType } from "@/types/project";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Users } from "lucide-react";
import { motion } from "framer-motion";

const MAX_VISIBLE_AVATARS = 3;
const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

interface ProjectCardProps {
    project: ProjectType;
    i: number;
}

export default function ProjectCard({ project, i }: ProjectCardProps) {
    const members = project.members || [];
    const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
    const extraCount = members.length - MAX_VISIBLE_AVATARS;

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.03 * i }}
        >
            <Link href={`/project/${project._id}`} className="block">
                <Card className="group relative overflow-hidden rounded-lg border border-border/40 dark:border-border/70 bg-card hover:border-primary/50 dark:hover:border-primary/60 hover:shadow-md dark:hover:shadow-primary/5 transition-all duration-200">
                    <CardContent className="p-3">
                        {/* Header Row */}
                        <div className="flex items-center gap-2 mb-2">
                            {/* Icon */}
                            {project.img ? (
                                <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden ring-1 ring-border/30 dark:ring-border/50">
                                    <Image
                                        src={project.img}
                                        alt={project.title}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="shrink-0 w-8 h-8 rounded-md bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                                    <span className="text-primary text-[11px] font-bold">
                                        {project.code?.slice(0, 2) || "PR"}
                                    </span>
                                </div>
                            )}

                            {/* Title & Code */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                    {project.title}
                                </h3>
                                <span className="text-[11px] font-mono font-medium text-muted-foreground">
                                    {project.code}
                                </span>
                            </div>

                            {/* Arrow */}
                            <ArrowRightIcon className="shrink-0 w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                            {project.description}
                        </p>

                        {/* Members Footer */}
                        <div className="flex items-center gap-2 pt-1.5 border-t border-border/30 dark:border-border/50">
                            {members.length > 0 ? (
                                <>
                                    <div className="flex -space-x-1.5">
                                        {visibleMembers.map((member: any, index) => (
                                            <div
                                                key={member.uid || member._id || index}
                                                className="w-5 h-5 rounded-full ring-1.5 ring-background dark:ring-card overflow-hidden bg-primary/10 dark:bg-primary/15 flex items-center justify-center"
                                                style={{ zIndex: visibleMembers.length - index }}
                                            >
                                                {member.avatar ? (
                                                    <Image
                                                        src={member.avatar}
                                                        alt={member.name || "User"}
                                                        width={20}
                                                        height={20}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-[9px] font-semibold text-primary">
                                                        {getInitials(member.name || member.email || "U")}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {extraCount > 0 && (
                                            <div className="w-5 h-5 rounded-full ring-1.5 ring-background dark:ring-card bg-muted flex items-center justify-center">
                                                <span className="text-[9px] font-semibold text-muted-foreground">
                                                    +{extraCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                        {members.length} {members.length === 1 ? 'member' : 'members'}
                                    </span>
                                </>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-muted-foreground/60" />
                                    <span className="text-[11px] text-muted-foreground/60">No members</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    );
}
