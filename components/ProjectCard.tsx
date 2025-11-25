import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Project as ProjectType } from "@/types/project";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const MAX_VISIBLE_AVATARS = 3;
const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

interface MemberAvatarProps {
    avatar: string;
    name: string;
    zIndex: number;
}

const MemberAvatar = ({ avatar, name, zIndex }: MemberAvatarProps) => (
    <Avatar 
        className="size-7 sm:size-8 rounded-full ring-2 ring-background"
        style={{ zIndex }}
    >
        <AvatarImage src={avatar} alt={name} className="rounded-full object-cover" />
        <AvatarFallback className="text-xs bg-primary/10 text-primary rounded-full">
            {getInitials(name)}
        </AvatarFallback>
    </Avatar>
);

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 * i }}
        >
            <Link href={`/project/${project._id}`} className="block h-full">
                <Card className="h-full rounded-md flex flex-col hover:shadow-lg transition-shadow duration-200 cursor-pointer group py-2 px-2 gap-0">
                    <CardHeader className="py-0 mb-2 flex justify-start items-center gap-2">
                        <Image 
                            src={project.img || ""} 
                            alt={project.title} 
                            width={100} 
                            height={100} 
                            className="w-10 h-10 rounded-sm object-cover" 
                        />
                        <CardTitle className="text-base sm:text-md group-hover:text-primary transition-colors">
                            {project.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 py-0 mt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto pt-1">
                            {members.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {visibleMembers.map((member: any, index) => (
                                            <MemberAvatar 
                                                key={member.uid || member._id || index}
                                                avatar={member.avatar || ""}
                                                name={member.name || member.email || "User"}
                                                zIndex={visibleMembers.length - index}
                                            />
                                        ))}
                                        {extraCount > 0 && (
                                            <Avatar className="size-7 sm:size-8 rounded-full ring-2 ring-background">
                                                <AvatarFallback className="text-xs bg-muted text-muted-foreground rounded-full">
                                                    +{extraCount}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                        <Users className="size-3 sm:size-4" />
                                        <span>{members.length}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                    <Users className="size-3 sm:size-4" />
                                    <span>No members</span>
                                </div>
                            )}
                            <ArrowRightIcon className="size-4 sm:size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    );
}