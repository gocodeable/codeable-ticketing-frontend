import { Team as TeamType } from "@/types/team"
import { Card, CardContent } from "./ui/card"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

interface TeamCardProps {
    team: TeamType
    i: number
}

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export default function TeamCard({ team, i }: TeamCardProps) {
    const visibleMembers = team.members.slice(0, 3)
    const extraCount = team.members.length - 3

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
                            <div className="flex -space-x-1.5">
                                {visibleMembers.map((member, index) => (
                                    member.avatar ? (
                                        <div
                                            key={member.id}
                                            className="w-6 h-6 rounded-full ring-2 ring-background dark:ring-background overflow-hidden"
                                            style={{ zIndex: visibleMembers.length - index }}
                                        >
                                            <Image
                                                src={member.avatar}
                                                alt={member.name}
                                                width={24}
                                                height={24}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            key={member.id}
                                            className="w-6 h-6 rounded-full ring-2 ring-background dark:ring-background bg-primary/10 dark:bg-primary/20 flex items-center justify-center"
                                            style={{ zIndex: visibleMembers.length - index }}
                                        >
                                            <span className="text-[10px] font-semibold text-primary dark:text-primary/90">
                                                {getInitials(member.name)}
                                            </span>
                                        </div>
                                    )
                                ))}
                                {extraCount > 0 && (
                                    <div className="w-6 h-6 rounded-full ring-2 ring-background dark:ring-background bg-muted dark:bg-muted flex items-center justify-center">
                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                            +{extraCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    )
}
