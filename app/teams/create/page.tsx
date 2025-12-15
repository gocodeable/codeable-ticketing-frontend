"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Card,
  CardContent,

} from "@/components/ui/card";
import { useAuth } from "@/lib/auth/AuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useImageSelection } from "@/hooks/useImageSelection";
import { ImageSelector } from "@/components/ImageSelector";
import Loader from "@/components/Loader";
import z from "zod";
import { apiPost } from "@/lib/api/apiClient";
import { UserSelector, UserSuggestion } from "@/components/UserSelector";
import { MemberRole } from "@/types/project";
import { getRoleColor, getRoleLabel } from "@/utils/roleUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Crown, Server, Monitor, Palette, Bug, UserX, Briefcase } from "lucide-react";
import Image from "next/image";

const teamSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  description: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      // Strip HTML tags and check text content length
      const textContent = val.replace(/<[^>]*>/g, '').trim();
      return textContent.length >= 10;
    }, "Description must have at least 10 characters of text content")
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      // Strip HTML tags and check text content length
      const textContent = val.replace(/<[^>]*>/g, '').trim();
      return textContent.length <= 5000;
    }, "Description must be less than 5000 characters of text content"),
  img: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type TeamFormData = z.infer<typeof teamSchema>;

export default function CreateTeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  interface UserWithRole extends UserSuggestion {
    role: MemberRole;
  }
  
  const [selectedUsers, setSelectedUsers] = useState<UserWithRole[]>([]);

  const imageSelection = useImageSelection({
    maxSizeMB: 5,
    onError: (error) => setError(error),
  });

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      img: "",
    },
  });

  // Handle individual user selection - add with default role
  const handleUsersChange = (users: UserSuggestion[]) => {
    const usersWithRoles: UserWithRole[] = users.map((user) => {
      // If user already exists, keep their role, otherwise default to unassigned
      const existing = selectedUsers.find((u) => u.uid === user.uid);
      return {
        ...user,
        role: existing?.role || ("unassigned" as MemberRole),
      };
    });
    setSelectedUsers(usersWithRoles);
  };

  // Handle role change for a user
  const handleRoleChange = (uid: string, newRole: MemberRole) => {
    setSelectedUsers((prev) =>
      prev.map((user) => (user.uid === uid ? { ...user, role: newRole } : user))
    );
  };

  const onSubmit = async (data: TeamFormData) => {
    // Set loading state immediately for better UX
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare data while getting token
      const memberUids = selectedUsers.map((u) => u.uid);
      const memberRoles = selectedUsers.map((u) => ({
        uid: u.uid,
        role: u.role,
      }));

      // Ensure creator is admin
      if (user?.uid) {
        const creatorRoleIndex = memberRoles.findIndex((mr) => mr.uid === user.uid);
        if (creatorRoleIndex >= 0) {
          memberRoles[creatorRoleIndex].role = "admin";
        } else {
          memberRoles.push({ uid: user.uid, role: "admin" });
          if (!memberUids.includes(user.uid)) {
            memberUids.push(user.uid);
          }
        }
      }

      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error("Unauthorized");
      }

      const response = await apiPost(
        "/teams/create/api",
        {
          name: form.getValues("name"),
          description: form.getValues("description"),
          img: imageSelection.imagePreview || "",
          members: memberUids,
          memberRoles: memberRoles,
        },
        idToken
      );

      if (!response.ok) {
        throw new Error("Failed to create team");
      }
      const data = await response.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      
      // Redirect immediately after success
      router.push(`/team/${data.data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen min-w-0 bg-background relative">
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center">
          <Loader size="lg" hue={265} />
        </div>
      )}

      <main className="w-full max-w-3xl mx-auto flex flex-col items-start justify-start gap-y-8 py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          className="w-full space-y-1.5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create New Team
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Start a new team and collaborate with others
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-border/40 dark:border-border rounded-xl overflow-hidden shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {/* Team Image Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">Team Icon</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose an icon to represent your team
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="img"
                      render={({ field }) => (
                        <ImageSelector
                          imageSelection={imageSelection}
                          urlField={field}
                          shape="square"
                          size="md"
                          layout="horizontal"
                          label=""
                          description="Upload a square image (max 5MB)"
                          showUrlInput={false}
                          disabled={loading}
                        />
                      )}
                    />
                  </div>

                  <div className="border-t border-border/40 dark:border-border/60" />

                  {/* Basic Information */}
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">Basic Information</h3>
                      <p className="text-sm text-muted-foreground">
                        Give your team a name and description
                      </p>
                    </div>

                    {/* Name Field */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Team Name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="e.g. Engineering Team"
                              className="h-10 rounded-lg"
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description Field */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Description
                          </FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Describe what this team does and its main objectives..."
                              disabled={loading}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            At least 10 characters of text content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t border-border/40 dark:border-border/60" />

                  {/* Members Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">
                        Team Members
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add people to your team (optional)
                      </p>
                    </div>
                    <UserSelector
                      selectedUsers={selectedUsers}
                      onUsersChange={handleUsersChange}
                      disabled={loading}
                      placeholder="Search by name or email..."
                    />
                    
                    {/* Selected Users with Role Selectors */}
                    {selectedUsers.length > 0 && (
                      <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                        {selectedUsers.map((user) => (
                          <div
                            key={user.uid}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all",
                              user.role === "admin"
                                ? "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200/50 dark:border-yellow-800/30"
                                : "bg-card border-border/50 hover:bg-muted/50 hover:border-border"
                            )}
                          >
                            {/* Avatar */}
                            <div className={cn(
                              "relative h-10 w-10 rounded-full overflow-hidden ring-2 shrink-0",
                              user.role === "admin" ? "ring-yellow-400/50" : "ring-border"
                            )}>
                              <Image
                                src={user.avatar || DEFAULT_AVATAR}
                                alt={user.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                              />
                            </div>

                            {/* Name and Email */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {user.name}
                                </p>
                                {user.role === "admin" && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-5 border-yellow-300 dark:border-yellow-700 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                                  >
                                    <Crown className="w-2.5 h-2.5 mr-0.5" />
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>

                            {/* Role Selector */}
                            <div className="flex items-center gap-2 shrink-0">
                              <Select
                                value={user.role || "unassigned"}
                                onValueChange={(value) =>
                                  handleRoleChange(user.uid, value as MemberRole)
                                }
                              >
                                <SelectTrigger className={cn(
                                  "min-w-[120px] max-w-[140px] h-8 text-xs border-border/50",
                                  user.role === "admin" && "border-yellow-300/50 dark:border-yellow-700/50"
                                )}>
                                  <SelectValue>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        getRoleColor(user.role)
                                      )} />
                                      <span className="truncate">
                                        {getRoleLabel(user.role)}
                                      </span>
                                    </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", getRoleColor("unassigned"))} />
                                      <UserX className="w-3 h-3 text-muted-foreground" />
                                      <span>Unassigned</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="backend">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", getRoleColor("backend"))} />
                                      <Server className="w-3 h-3 text-muted-foreground" />
                                      <span>Backend</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="frontend">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", getRoleColor("frontend"))} />
                                      <Monitor className="w-3 h-3 text-muted-foreground" />
                                      <span>Frontend</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="ui">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", getRoleColor("ui"))} />
                                      <Palette className="w-3 h-3 text-muted-foreground" />
                                      <span>UI</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="qa">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", getRoleColor("qa"))} />
                                      <Bug className="w-3 h-3 text-muted-foreground" />
                                      <span>QA</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="pm">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", getRoleColor("pm"))} />
                                      <Briefcase className="w-3 h-3 text-muted-foreground" />
                                      <span>PM</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", getRoleColor("admin"))} />
                                      <Crown className="w-3 h-3 text-muted-foreground" />
                                      <span>Admin</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 p-3.5"
                    >
                      <p className="text-sm font-medium text-destructive dark:text-destructive">
                        {error}
                      </p>
                    </motion.div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/40 p-3.5"
                    >
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Team created successfully! Redirecting...
                      </p>
                    </motion.div>
                  )}

                  {/* Form Actions */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto rounded-lg hover:bg-muted/50 dark:hover:bg-muted/50 transition-all duration-200"
                      onClick={() => router.push("/teams")}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto sm:ml-auto rounded-lg bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 hover:shadow-md transition-all duration-200"
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Create Team"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

