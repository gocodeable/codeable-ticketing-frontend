import { Recents } from "@/types/recents";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel"
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { FolderIcon, KanbanIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

export function RecentsCarousel({ recents }: { recents: Recents[] }) {
    if (!recents) return null;
    return (
        <Carousel
            className="w-full max-w-full"
            opts={{ loop: true, align: "start" }}
            plugins={[
                Autoplay({
                    delay: 6000,
                    stopOnInteraction: true,
                }),
            ]}
        >
            <CarouselContent className="ml-0">
                {recents.map((recent, index) => {
                    const href = recent.type === "project" ? `/project/${recent.resourceId}` : `/issue/${recent.resourceId}`;
                    return (
                        <CarouselItem
                            key={`${recent.type}-${recent.resourceId}-${index}`}
                            className="pl-0 pr-3 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 cursor-pointer select-none"
                        >
                            <Link href={href} className="h-full block group">
                                <div className="h-full p-3 rounded-xl border border-border/40 bg-card dark:bg-card/30 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200">
                                    <div className="flex items-start gap-3">
                                        {recent.img ? (
                                            <div className="shrink-0 rounded-md overflow-hidden w-8 h-8 ring-1 ring-border/20">
                                                <Image
                                                    src={recent.img}
                                                    alt={recent.title}
                                                    width={32}
                                                    height={32}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="shrink-0 w-8 h-8 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                                {recent.type === "project" ? (
                                                    <FolderIcon className="w-4 h-4 text-primary dark:text-primary/90" />
                                                ) : (
                                                    <KanbanIcon className="w-4 h-4 text-primary dark:text-primary/90" />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                                    {recent.title}
                                                </h3>
                                                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                                                    {recent.lastAccessed
                                                        ? formatDistanceToNow(new Date(recent.lastAccessed), { addSuffix: true })
                                                        : "N/A"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground capitalize">{recent.type}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </CarouselItem>
                    );
                })}
            </CarouselContent>
        </Carousel>
    );
}
