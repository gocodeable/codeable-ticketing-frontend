"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { DEFAULT_AVATAR } from "@/lib/constants";

export interface UserSuggestion {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserSelectorProps {
  selectedUsers: UserSuggestion[];
  onUsersChange: (users: UserSuggestion[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function UserSelector({
  selectedUsers,
  onUsersChange,
  disabled = false,
  placeholder = "Search users by name or email...",
  className,
}: UserSelectorProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
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
          `/api/user/suggestions?query=${encodeURIComponent(searchQuery)}&limit=5`,
          idToken
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Filter out already selected users
            const filteredSuggestions = data.data.filter(
              (suggestion: UserSuggestion) =>
                !selectedUsers.some((u) => u.uid === suggestion.uid)
            );
            setSuggestions(filteredSuggestions);
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error("Error fetching user suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedUsers, user]);

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

  const handleSelectUser = (user: UserSuggestion) => {
    onUsersChange([...selectedUsers, user]);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemoveUser = (uid: string) => {
    onUsersChange(selectedUsers.filter((u) => u.uid !== uid));
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
          handleSelectUser(suggestions[focusedIndex]);
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
      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.filter(u => u && u.uid).map((selectedUser, index) => (
            <Badge
              key={selectedUser.uid || `user-${index}`}
              variant="secondary"
              className="h-9 pl-1 pr-2 py-1 flex items-center gap-2 text-sm font-medium bg-primary/10 hover:bg-primary/20 border-primary/20 transition-colors"
            >
              <div className="relative h-6 w-6 rounded-full overflow-hidden ring-2 ring-background">
                <Image
                  src={selectedUser.avatar || DEFAULT_AVATAR}
                  alt={selectedUser.name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              </div>
              <span className="text-sm font-medium">{selectedUser.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveUser(selectedUser.uid)}
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
            {suggestions.filter(s => s && s.uid).map((suggestion, index) => (
              <button
                key={suggestion.uid || `suggestion-${index}`}
                type="button"
                onClick={() => handleSelectUser(suggestion)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0",
                  focusedIndex === index && "bg-muted"
                )}
              >
                <div className="shrink-0 relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-border">
                  <Image
                    src={suggestion.avatar || DEFAULT_AVATAR}
                    alt={suggestion.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {suggestion.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.email}
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
              No users found matching &quot;{searchQuery}&quot;
            </div>
          )}
      </div>
    </div>
  );
}

