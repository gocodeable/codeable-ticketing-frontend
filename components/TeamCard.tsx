import { Team as TeamType } from "@/types/team"
import { Card, CardContent } from "./ui/card"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { getInitials } from "@/utils/issueUtils"

interface TeamCardProps {
    team: TeamType
    i: number
}

const MAX_VISIBLE_AVATARS = 5

export default function TeamCard({ team, i }: TeamCardProps) {
    const members = team.members || []
    const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS)
    const extraCount = members.length - MAX_VISIBLE_AVATARS

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 * i }}
        >
            <Link href={`/team/${team._id}`} className="block h-full">
                <Card className="h-full rounded-xl flex flex-col border-border/40 dark:border-border hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 hover:shadow-md dark:hover:shadow-primary/10 transition-all duration-200 cursor-pointer group p-3.5">
                    <CardContent className="p-0 flex flex-col gap-2.5">
                        <div className="flex items-start gap-2.5">
                            {team.img ? (
                                <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden ring-1 ring-border/30 dark:ring-border">
                                    <Image
                                        src={team.img}
                                        alt={team.name}
                                        width={36}
                                        height={36}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="shrink-0 w-9 h-9 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                                    <span className="text-primary dark:text-primary/90 font-bold text-xs">
                                        {team.name.slice(0, 2).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-1 mb-0.5">
                                    {team.name}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {team.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border/40 dark:border-border/60">
                            {members.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-0.5">
                                        {visibleMembers.map((member: any, index) => (
                                            <div
                                                key={member.id || member.uid || index}
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
                                <span className="text-[11px] text-muted-foreground/60">No members</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    )
}
