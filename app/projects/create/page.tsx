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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TeamSelector, TeamSuggestion } from "@/components/TeamSelector";
import { Users, UserPlus, Crown, Server, Monitor, Palette, TestTube, UserX, Briefcase } from "lucide-react";
import Image from "next/image";
import { generateProjectCode } from "@/utils/generateProjectCode";
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

const projectSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be at most 10 characters")
    .regex(/^[A-Z][A-Z0-9]*$/, "Code must start with a letter and contain only uppercase letters and numbers"),
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
  img: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        if (val.startsWith("data:image/")) return true;
        return val.startsWith("http://") || val.startsWith("https://");
      },
      { message: "Please upload a valid image" }
    )
    .or(z.literal("")),
  figmaLink: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        try {
          const url = new URL(val);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid HTTP or HTTPS URL" }
    )
    .or(z.literal("")),
  swaggerLink: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        try {
          const url = new URL(val);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid HTTP or HTTPS URL" }
    )
    .or(z.literal("")),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function CreateProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  interface UserWithRole extends UserSuggestion {
    role: MemberRole;
  }
  
  const [selectedUsers, setSelectedUsers] = useState<UserWithRole[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<TeamSuggestion[]>([]);
  const [linkedTeam, setLinkedTeam] = useState<TeamSuggestion | null>(null);

  const imageSelection = useImageSelection({
    maxSizeMB: 5,
    onError: (error) => setError(error),
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      code: "",
      description: "",
      img: "",
      figmaLink: "",
      swaggerLink: "",
    },
  });

  // Handle team selection - add all team members to selected users and link project to team
  const handleTeamSelected = (team: TeamSuggestion) => {
    // Get unique members by combining existing and new team members
    // Use team member roles if available, otherwise default to unassigned
    const newMembers: UserWithRole[] = team.members
      .filter((member) => !selectedUsers.some((u) => u.uid === member.uid))
      .map((member) => ({
        ...member,
        role: ((member as any).role || "unassigned") as MemberRole,
      }));
    setSelectedUsers([...selectedUsers, ...newMembers]);
    
    // Set this team as the linked team for the project
    setLinkedTeam(team);
  };

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

  const onSubmit = async (data: ProjectFormData) => {
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

      const adminUids = selectedUsers
        .filter((u) => u.role === "admin" || u.role === "pm")
        .map((u) => u.uid);
      
      if (user?.uid && !adminUids.includes(user.uid)) {
        adminUids.push(user.uid);
        const creatorRoleIndex = memberRoles.findIndex((mr) => mr.uid === user.uid);
        if (creatorRoleIndex >= 0) {
          memberRoles[creatorRoleIndex].role = "admin";
        } else {
          memberRoles.push({ uid: user.uid, role: "admin" });
        }
      }

      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error("Unauthorized");
      }

      const response = await apiPost(
        "/projects/create/api",
        {
          title: form.getValues("title"),
          code: form.getValues("code"),
          description: form.getValues("description"),
          img: imageSelection.imagePreview || "",
          figmaLink: form.getValues("figmaLink") || "",
          swaggerLink: form.getValues("swaggerLink") || "",
          members: memberUids,
          memberRoles: memberRoles,
          admin: adminUids,
          teamId: linkedTeam?._id || undefined,
        },
        idToken
      );

      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      const data = await response.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      
      // Redirect immediately after success
      router.push(`/project/${data.data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen min-w-0 bg-background font-sans relative">
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader size="lg" hue={265} />
        </div>
      )}

      <main className="w-full max-w-4xl mx-auto flex flex-col items-start justify-start gap-y-5 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-16">
        {/* Page Header */}
        <motion.div
          className="w-full space-y-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Create New Project
          </h1>
          <p className="text-sm text-muted-foreground">
            Start a new project and collaborate with your team
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-border/40 dark:border-border/70 rounded-xl overflow-hidden shadow-sm">
            <CardContent className="p-5 sm:p-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Project Icon Section */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Project Icon</h3>
                        <p className="text-xs text-muted-foreground">Choose an icon to represent your project</p>
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

                    {/* Basic Information Section */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
                        <p className="text-xs text-muted-foreground">Define the core details of your project</p>
                      </div>

                      {/* Title Field */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Title <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Enter project title"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-generate code from title
                                  const generatedCode = generateProjectCode(e.target.value);
                                  form.setValue("code", generatedCode);
                                }}
                                disabled={loading}
                                className="rounded-lg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Project Code Field */}
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Code <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="PROJ"
                                {...field}
                                onChange={(e) => {
                                  // Force uppercase
                                  const upperValue = e.target.value.toUpperCase();
                                  field.onChange(upperValue);
                                }}
                                maxLength={10}
                                disabled={loading}
                                className="font-mono font-semibold rounded-lg"
                              />
                            </FormControl>
                            <FormDescription>
                              Auto-generated from title (2-10 characters, uppercase)
                            </FormDescription>
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <RichTextEditor
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Describe your project goals and objectives..."
                                disabled={loading}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t border-border/40 dark:border-border/60" />

                    {/* External Links Section */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">External Links</h3>
                        <p className="text-xs text-muted-foreground">Connect design files and documentation</p>
                      </div>

                      {/* Figma Link Field */}
                      <FormField
                        control={form.control}
                        name="figmaLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Figma Link</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Image
                                  src="/figma.png"
                                  alt="Figma"
                                  width={16}
                                  height={16}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                />
                                <Input
                                  type="url"
                                  placeholder="https://figma.com/..."
                                  {...field}
                                  disabled={loading}
                                  className="rounded-lg pl-9"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Swagger Link Field */}
                      <FormField
                        control={form.control}
                        name="swaggerLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Documentation Link</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Image
                                  src="/swagger.png"
                                  alt="Swagger"
                                  width={16}
                                  height={16}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                />
                                <Input
                                  type="url"
                                  placeholder="https://..."
                                  {...field}
                                  disabled={loading}
                                  className="rounded-lg pl-9"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t border-border/40 dark:border-border/60" />

                    {/* Team Members Section */}
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Team Members</h3>
                        <p className="text-xs text-muted-foreground">Add people to your project (optional)</p>
                      </div>

                      <Tabs defaultValue="members" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-10 rounded-lg bg-muted/60">
                          <TabsTrigger value="members" className="gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <UserPlus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline text-sm">Individual Members</span>
                            <span className="sm:hidden text-sm">Members</span>
                          </TabsTrigger>
                          <TabsTrigger value="teams" className="gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Users className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline text-sm">Add by Team</span>
                            <span className="sm:hidden text-sm">Teams</span>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="members" className="mt-3.5 space-y-2">
                          <UserSelector
                            selectedUsers={selectedUsers}
                            onUsersChange={handleUsersChange}
                            disabled={loading}
                            placeholder="Search users by name or email..."
                          />
                          <FormDescription className="text-xs">
                            Search and select individual project members
                          </FormDescription>
                          
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
                                            <TestTube className="w-3 h-3 text-muted-foreground" />
                                            <span>QA</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="pm">
                                          <div className="flex items-center gap-2">
                                            <span className={cn("w-2 h-2 rounded-full", getRoleColor("pm"))} />
                                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                                            <span>Project Manager</span>
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
                        </TabsContent>

                        <TabsContent value="teams" className="mt-3.5 space-y-2">
                          <TeamSelector
                            selectedTeams={selectedTeams}
                            onTeamsChange={setSelectedTeams}
                            onTeamSelected={handleTeamSelected}
                            disabled={loading}
                            placeholder="Search teams to add all members..."
                          />
                          <FormDescription className="text-xs">
                            Select a team to add all members and link the project
                          </FormDescription>
                        </TabsContent>
                      </Tabs>

                      {linkedTeam && (
                        <motion.div
                          className="rounded-lg bg-primary/10 dark:bg-primary/10 border border-primary/30 dark:border-primary/30 p-2.5"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="text-xs font-medium text-primary dark:text-primary">
                            Linked to team: <strong>{linkedTeam.name}</strong>
                          </p>
                        </motion.div>
                      )}

                      {selectedUsers.length === 0 && error && (
                        <p className="text-xs font-medium text-destructive">
                          At least one member is required
                        </p>
                      )}

                      {selectedUsers.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/40 dark:border-border/60">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
                            <Users className="w-3 h-3 text-primary" />
                          </div>
                          <p className="text-xs font-medium text-foreground">
                            {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        className="rounded-lg bg-destructive/10 dark:bg-destructive/10 border border-destructive/30 dark:border-destructive/30 p-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-xs font-medium text-destructive dark:text-destructive">
                          {error}
                        </p>
                      </motion.div>
                    )}

                    {/* Success Message */}
                    {success && (
                      <motion.div
                        className="rounded-lg bg-green-500/10 dark:bg-green-500/10 border border-green-500/30 dark:border-green-500/30 p-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                          Project created successfully! Redirecting...
                        </p>
                      </motion.div>
                    )}

                    {/* Form Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-5 border-t border-border/40 dark:border-border/60">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto rounded-lg text-sm h-9"
                        onClick={() => router.push("/projects")}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto sm:ml-auto rounded-lg bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 shadow-sm hover:shadow transition-all duration-200 text-sm h-9 font-medium"
                        disabled={loading}
                      >
                        {loading ? "Creating..." : "Create Project"}
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
