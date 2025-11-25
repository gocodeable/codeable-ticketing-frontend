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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Users, UserPlus } from "lucide-react";
import { generateProjectCode } from "@/utils/generateProjectCode";

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
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  img: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function CreateProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<UserSuggestion[]>([]);
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
    },
  });

  // Handle team selection - add all team members to selected users and link project to team
  const handleTeamSelected = (team: TeamSuggestion) => {
    // Get unique members by combining existing and new team members
    const newMembers = team.members.filter(
      (member) => !selectedUsers.some((u) => u.uid === member.uid)
    );
    setSelectedUsers([...selectedUsers, ...newMembers]);
    
    // Set this team as the linked team for the project
    setLinkedTeam(team);
  };

  const onSubmit = async (data: ProjectFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate that at least one member is selected
    if (selectedUsers.length === 0) {
      setError("Please add at least one project member");
      setLoading(false);
      return;
    }

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error("Unauthorized");
      }

      // Send member UIDs directly (much faster than email lookup)
      const memberUids = selectedUsers.map((u) => u.uid);

      const response = await apiPost(
        "/projects/create/api",
        {
          title: form.getValues("title"),
          code: form.getValues("code"),
          description: form.getValues("description"),
          img: imageSelection.imagePreview || "",
          members: memberUids,
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
      form.reset();
      imageSelection.removeImage();
      setSelectedUsers([]);
      setSelectedTeams([]);
      setLinkedTeam(null);

      // Redirect to projects page after success
      setTimeout(() => {
        router.push(`/project/${data.data._id}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen min-w-0 bg-background font-sans bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader size="lg" hue={300} />
        </div>
      )}

      <main className="w-full max-w-4xl mx-auto flex flex-col items-start justify-start gap-y-6 sm:gap-y-8 py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 md:pb-24">
        {/* Page Header */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Create New Project
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Start a new project and collaborate with your team
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Project Details</CardTitle>
              <CardDescription className="text-base">
                Fill in the information below to create your project
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Project Image Section */}
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
                          label="Project Icon"
                          description="Upload a square image (max 5MB)"
                          showUrlInput={true}
                          disabled={loading}
                        />
                      )}
                    />

                    {/* Title Field */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title *</FormLabel>
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
                          <FormLabel>Project Code *</FormLabel>
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
                              className="font-mono font-semibold"
                            />
                          </FormControl>
                          <FormDescription>
                            Auto-generated from title. You can edit it if needed (2-10 characters, uppercase letters/numbers).
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
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your project..."
                              className="min-h-[120px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a clear description of your project goals
                            and objectives
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Members Selection with Tabs */}
                    <div className="space-y-2">
                      <FormLabel>Add Members *</FormLabel>
                      <Tabs defaultValue="members" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="members" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            <p className="hidden sm:block">Individual Members</p>
                          </TabsTrigger>
                          <TabsTrigger value="teams" className="gap-2">
                            <Users className="h-4 w-4" />
                            <p className="hidden sm:block">Add by Team</p>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="members" className="mt-4 space-y-2">
                          <UserSelector
                            selectedUsers={selectedUsers}
                            onUsersChange={setSelectedUsers}
                            disabled={loading}
                            placeholder="Search users by name or email..."
                          />
                          <FormDescription>
                            Search and select individual project members
                          </FormDescription>
                        </TabsContent>
                        
                        <TabsContent value="teams" className="mt-4 space-y-2">
                          <TeamSelector
                            selectedTeams={selectedTeams}
                            onTeamsChange={setSelectedTeams}
                            onTeamSelected={handleTeamSelected}
                            disabled={loading}
                            placeholder="Search teams to add all members..."
                          />
                          <FormDescription>
                            Select a team to automatically add all its members and link the project to that team
                          </FormDescription>
                        </TabsContent>
                      </Tabs>
                      
                      {linkedTeam && (
                        <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                          <p className="text-sm font-medium text-primary">
                            This project will be linked to team: <strong>{linkedTeam.name}</strong>
                          </p>
                        </div>
                      )}
                      
                      {selectedUsers.length === 0 && error && (
                        <p className="text-sm font-medium text-destructive">
                          At least one member is required
                        </p>
                      )}
                      
                      {selectedUsers.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                        <p className="text-sm font-medium text-destructive">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* Success Message */}
                    {success && (
                      <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Project created successfully! Redirecting...
                        </p>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/50 mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => router.push("/projects")}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto sm:ml-auto shadow-sm hover:shadow-md transition-shadow"
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
