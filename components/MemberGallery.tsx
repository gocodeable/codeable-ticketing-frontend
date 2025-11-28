"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, ChevronLeft, ChevronRight, Crown, Code, Bug } from "lucide-react";

interface MemberGalleryProps {
  members: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: "admin" | "developer" | "qa";
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
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleMemberClick = (memberId: string) => {
    router.push(`/profile/${memberId}`);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-3 h-3" />;
      case "qa":
        return <Bug className="w-3 h-3" />;
      case "developer":
      default:
        return <Code className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
      case "qa":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
      case "developer":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800";
    }
  };

  const getRoleLabel = (role?: string) => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Developer";
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
      const scrollAmount = 400;
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
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background border border-border rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background border border-border rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>
        )}

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingTop: "3rem",
            paddingBottom: "3rem",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            marginTop: "-3rem",
            marginBottom: "-3rem",
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
              style={{ width: "250px" }}
              onClick={() => handleMemberClick(member.id)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Card */}
              <div className="relative bg-card rounded-2xl overflow-hidden shadow-lg border border-border hover:border-primary transition-all duration-300">
                {/* Avatar Container */}
                <div className="relative w-full aspect-square bg-linear-to-br from-primary/20 to-purple-500/20 flex items-center justify-center overflow-hidden">
                  {member.avatar ? (
                    <Image
                      src={member.avatar}
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

                {/* Member Info */}
                <div className="p-4 bg-card">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-foreground truncate">
                      {member.name}
                    </h3>
                    {shouldShowBadge(member) && (
                      <span
                        className={`shrink-0 text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${getRoleColor(
                          showOnlyAdminBadge ? "admin" : member.role
                        )}`}
                      >
                        {getRoleIcon(showOnlyAdminBadge ? "admin" : member.role)}
                        {getRoleLabel(showOnlyAdminBadge ? "admin" : member.role)}
                      </span>
                    )}
                  </div>
                  {member.email && (
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                  )}
                </div>

                {/* Hover Effect - Arrow */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>
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
