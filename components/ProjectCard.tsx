import { Card, CardContent } from "./ui/card";
import { Project as ProjectType } from "@/types/project";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Users, PinOff } from "lucide-react";
import { motion } from "framer-motion";
import { getInitials } from "@/utils/issueUtils";
import { Button } from "./ui/button";

const MAX_VISIBLE_AVATARS = 5;

interface ProjectCardProps {
    project: ProjectType;
    i: number;
    isPinned?: boolean;
    onUnpin?: (projectId: string) => void;
}

// Helper function to strip HTML tags and get plain text (explicitly removes images)
const stripHtmlTags = (html: string): string => {
    if (!html) return "";
    // First, explicitly remove image tags (including self-closing and with attributes)
    let text = html
        .replace(/<img[^>]*>/gi, '') // Remove <img> tags (self-closing)
        .replace(/<img[^>]*\/>/gi, '') // Remove <img /> tags
        .replace(/<\/img>/gi, ''); // Remove closing </img> tags (if any)
    
    // Then remove all other HTML tags
    text = text
        .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .replace(/&#39;/g, "'") // Replace &#39; with '
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
    
    return text;
};

export default function ProjectCard({ project, i, isPinned = false, onUnpin }: ProjectCardProps) {
    const members = project.members || [];
    const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
    const extraCount = members.length - MAX_VISIBLE_AVATARS;

    const handleUnpin = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onUnpin && project._id) {
            onUnpin(project._id);
        }
    };

    return (
        <motion.div
            className="w-full relative group"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.03 * i }}
        >
            {/* Unpin Button - Positioned on top of the card corner */}
            {isPinned && onUnpin && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 left-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 rounded-full bg-background hover:bg-destructive/20 hover:text-destructive border border-border shadow-md"
                    onClick={handleUnpin}
                    title="Unpin project"
                >
                    <PinOff className="h-4 w-4" />
                </Button>
            )}
            <Link href={`/project/${project._id}`} className="block">
                <Card className="relative overflow-hidden rounded-lg border border-border/40 dark:border-border/70 bg-card group-hover:border-primary/50 dark:group-hover:border-primary/60 group-hover:shadow-md dark:group-hover:shadow-primary/5 transition-all duration-200">
                    <CardContent className="px-3">
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
                                        {getInitials(project.title || project.code || "PR")}
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
                            {project.description ? stripHtmlTags(project.description) : "No description"}
                        </p>

                        {/* Members Footer */}
                        <div className="flex items-center gap-2 pt-1.5 border-t border-border/30 dark:border-border/50">
                            {members.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-0.5">
                                        {visibleMembers.map((member: any, index) => (
                                            <div
                                                key={member.uid || member._id || index}
                                                className="relative w-6 h-6 rounded-full ring-1.5 ring-background dark:ring-card overflow-hidden bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0"
                                                style={{ zIndex: visibleMembers.length - index }}
                                            >
                                                {member.avatar ? (
                                                    <Image
                                                        src={member.avatar}
                                                        alt={member.name || "User"}
                                                        width={24}
                                                        height={24}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-semibold text-primary">
                                                        {getInitials(member.name || member.email || "U")}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {extraCount > 0 && (
                                            <div className="relative w-6 h-6 rounded-full ring-1.5 ring-background dark:ring-card overflow-hidden bg-muted hover:bg-muted/80 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-semibold text-foreground">
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
