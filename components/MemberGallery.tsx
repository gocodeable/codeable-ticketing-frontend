"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, ChevronLeft, ChevronRight, Crown, Server, Monitor, Palette, TestTube, UserX, Briefcase } from "lucide-react";
import { getRoleLabel } from "@/utils/roleUtils";
import { MemberRole } from "@/types/project";
import { getAvatarUrl } from "@/lib/utils";

interface MemberGalleryProps {
  members: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    updatedAt?: string;
    role?: MemberRole;
  }[];
  adminList?: string[];
  showOnlyAdminBadge?: boolean;
}

export default function MemberGallery({
  members,
  adminList = [],
  showOnlyAdminBadge = false
}: MemberGalleryProps) {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const checkScrollNeeded = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        const needsScroll = scrollWidth > clientWidth;
        setShowRightArrow(needsScroll);
        setShowLeftArrow(false); // Always start with left arrow hidden
      }
    };

    // Check immediately
    checkScrollNeeded();

    // Also check after a short delay to ensure layout is complete
    const timer = setTimeout(checkScrollNeeded, 100);

    // Add resize observer to handle window resizing
    const resizeObserver = new ResizeObserver(checkScrollNeeded);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [members]);

  const handleMemberClick = (memberId: string) => {
    router.push(`/profile/${memberId}`);
  };

  const getRoleIcon = (role?: MemberRole | string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-3 h-3" />;
      case "backend":
        return <Server className="w-3 h-3" />;
      case "frontend":
        return <Monitor className="w-3 h-3" />;
      case "ui":
        return <Palette className="w-3 h-3" />;
      case "qa":
        return <TestTube className="w-3 h-3" />;
      case "pm":
        return <Briefcase className="w-3 h-3" />;
      case "unassigned":
        return <UserX className="w-3 h-3" />;
      default:
        return <UserX className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role?: MemberRole | string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
      case "backend":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800";
      case "frontend":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "ui":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-800";
      case "qa":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
      case "pm":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800";
      case "unassigned":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800";
    }
  };

  const isAdmin = (memberId: string) => {
    return adminList.includes(memberId);
  };

  const shouldShowBadge = (member: { id: string; role?: string }) => {
    if (showOnlyAdminBadge) {
      // For teams: only show badge if member is admin
      return isAdmin(member.id);
    }
    // For projects: show all role badges
    return member.role !== undefined;
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Reduced to match smaller card size
      const newScrollLeft =
        direction === "left"
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="w-full max-w-full relative overflow-visible">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingTop: "2rem",
            paddingBottom: "2rem",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            marginTop: "-2rem",
            marginBottom: "-2rem",
          }}
        >
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`group relative cursor-pointer transition-all duration-300 shrink-0 ${
                hoveredIndex === index
                  ? "scale-105 z-10"
                  : hoveredIndex !== null
                  ? "scale-95 opacity-70"
                  : "scale-100"
              }`}
              style={{ width: "200px" }}
              onClick={() => handleMemberClick(member.id)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Card */}
              <div className="relative bg-card rounded-xl overflow-hidden shadow-sm dark:shadow-xs border border-border hover:border-primary transition-all duration-300">
                {/* Avatar Container */}
                <div className="relative w-full aspect-square bg-linear-to-br from-primary/20 to-purple-500/20 flex items-center justify-center overflow-hidden">
                  {member.avatar ? (
                    <Image
                      src={getAvatarUrl(member.avatar, member.updatedAt)}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      onError={(e) => {
                        // Hide broken image and show fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/30 to-purple-500/30">
                      <User className="w-1/2 h-1/2 text-primary/40" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>

                {shouldShowBadge(member) && (
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 shadow-sm backdrop-blur-sm ${getRoleColor(
                        showOnlyAdminBadge ? "admin" : member.role
                      )}`}
                    >
                      {getRoleIcon(showOnlyAdminBadge ? "admin" : member.role)}
                      {getRoleLabel(showOnlyAdminBadge ? "admin" : member.role)}
                    </span>
                  </div>
                )}

                {/* Member Info */}
                <div className="p-3 bg-card">
                  <h3 className="font-semibold text-base text-foreground truncate mb-1.5">
                    {member.name}
                  </h3>
                  {member.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <User className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Members Yet
            </h3>
            <p className="text-muted-foreground">
              Members will appear here once they join the team.
            </p>
          </div>
        )}
      </div>

      {/* Custom CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
