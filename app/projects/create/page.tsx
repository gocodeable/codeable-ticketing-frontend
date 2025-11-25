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

const projectSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
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

  const imageSelection = useImageSelection({
    maxSizeMB: 5,
    onError: (error) => setError(error),
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      img: "",
    },
  });

  // Handle team selection - add all team members to selected users
  const handleTeamSelected = (team: TeamSuggestion) => {
    // Get unique members by combining existing and new team members
    const newMembers = team.members.filter(
      (member) => !selectedUsers.some((u) => u.uid === member.uid)
    );
    setSelectedUsers([...selectedUsers, ...newMembers]);
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

      // Convert selected users to comma-separated emails
      const memberEmails = selectedUsers.map((u) => u.email).join(",");

      const response = await apiPost(
        "/projects/create/api",
        {
          title: form.getValues("title"),
          description: form.getValues("description"),
          img: imageSelection.imagePreview || "",
          members: memberEmails,
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

      <main className="w-full mx-auto flex flex-col items-start justify-start gap-y-8 py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12 pb-16 sm:pb-20 md:pb-24">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto max-w-2xl">
            {/* Page Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Create New Project
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Start a new project and collaborate with your team
              </p>
            </div>

            {/* Form Card */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
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
                            Select a team to automatically add all its members to the project
                          </FormDescription>
                        </TabsContent>
                      </Tabs>
                      
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
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
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
                        className="w-full sm:w-auto sm:ml-auto"
                        disabled={loading}
                      >
                        {loading ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
