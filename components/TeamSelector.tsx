"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Loader2, Users } from "lucide-react";
import { apiGet } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserSuggestion } from "./UserSelector";

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

export interface TeamSuggestion {
  _id: string;
  name: string;
  img?: string;
  description?: string;
  members: UserSuggestion[];
}

interface TeamSelectorProps {
  selectedTeams: TeamSuggestion[];
  onTeamsChange: (teams: TeamSuggestion[]) => void;
  onTeamSelected: (team: TeamSuggestion) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TeamSelector({
  selectedTeams,
  onTeamsChange,
  onTeamSelected,
  disabled = false,
  placeholder = "Search teams by name...",
  className,
}: TeamSelectorProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TeamSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const idToken = await user?.getIdToken();
        const response = await apiGet(
          `/api/team/suggestions?query=${encodeURIComponent(searchQuery)}&limit=5`,
          idToken
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Filter out already selected teams
            const filteredSuggestions = data.data.filter(
              (suggestion: TeamSuggestion) =>
                !selectedTeams.some((t) => t._id === suggestion._id)
            );
            setSuggestions(filteredSuggestions);
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error("Error fetching team suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedTeams, user]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTeam = (team: TeamSuggestion) => {
    onTeamsChange([...selectedTeams, team]);
    onTeamSelected(team); // Notify parent to add all members
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemoveTeam = (teamId: string) => {
    onTeamsChange(selectedTeams.filter((t) => t._id !== teamId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelectTeam(suggestions[focusedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Teams */}
      {selectedTeams.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTeams.map((selectedTeam) => (
            <Badge
              key={selectedTeam._id}
              variant="secondary"
              className="h-9 pl-1 pr-2 py-1 flex items-center gap-2 text-sm font-medium bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 transition-colors"
            >
              <div className="relative h-6 w-6 rounded-md overflow-hidden ring-2 ring-background">
                {selectedTeam.img ? (
                  <Image
                    src={selectedTeam.img}
                    alt={selectedTeam.name}
                    width={24}
                    height={24}
                    className="rounded-md object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-3 w-3 text-blue-600" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium">{selectedTeam.name}</span>
              <span className="text-xs text-muted-foreground">
                ({selectedTeam.members.length} members)
              </span>
              <button
                type="button"
                onClick={() => handleRemoveTeam(selectedTeam._id)}
                disabled={disabled}
                className="ml-1 hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5 transition-colors disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            disabled={disabled}
            className="pl-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion._id}
                type="button"
                onClick={() => handleSelectTeam(suggestion)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0",
                  focusedIndex === index && "bg-muted"
                )}
              >
                <div className="shrink-0 relative h-10 w-10 rounded-md overflow-hidden ring-2 ring-border">
                  {suggestion.img ? (
                    <Image
                      src={suggestion.img}
                      alt={suggestion.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-blue-500/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {suggestion.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.members.length} members
                    {suggestion.description && ` • ${stripHtmlTags(suggestion.description)}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showSuggestions &&
          !isLoading &&
          searchQuery.length >= 2 &&
          suggestions.length === 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground"
            >
              No teams found matching &quot;{searchQuery}&quot;
            </div>
          )}
      </div>
    </div>
  );
}

