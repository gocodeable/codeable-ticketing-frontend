import { Team as TeamType } from "@/types/team"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRightIcon, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import Image from "next/image"

const MAX_VISIBLE_AVATARS = 3
const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

interface MemberAvatarProps {
    avatar: string
    name: string
    zIndex: number
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
)

interface TeamCardProps {
    team: TeamType
    i: number
}

export default function TeamCard({ team, i }: TeamCardProps) {
    const visibleMembers = team.members.slice(0, MAX_VISIBLE_AVATARS)
    const extraCount = team.members.length - MAX_VISIBLE_AVATARS

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 * i }}
        >
            <Link href={`/team/${team._id}`} className="block h-full">
                <Card className="h-full rounded-xs flex flex-col hover:shadow-lg transition-shadow duration-200 cursor-pointer group py-2 px-2 gap-0">
                    <CardHeader className="py-0 mb-1 flex justify-start items-center gap-2">
                        {team.img ? (
                            <Image src={team.img} alt={team.name} width={100} height={100} className="w-10 h-10 rounded-sm object-cover" />
                        ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center">
                                <span className="text-primary font-bold text-xs">{team.name.slice(0, 2).toUpperCase()}</span>
                            </div>
                        )}
                        <CardTitle className="text-base sm:text-md group-hover:text-primary transition-colors">
                            {team.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 py-0 mt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {team.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto pt-1">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {visibleMembers.map((member, index) => (
                                        <MemberAvatar 
                                            key={member.id}
                                            avatar={member.avatar || ""}
                                            name={member.name}
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
                                    <span>{team.members.length}</span>
                                </div>
                            </div>
                            <ArrowRightIcon className="size-4 sm:size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    )
}
