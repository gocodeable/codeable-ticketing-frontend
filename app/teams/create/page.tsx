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

const teamSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  img: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type TeamFormData = z.infer<typeof teamSchema>;

export default function CreateTeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<UserSuggestion[]>([]);

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

  const onSubmit = async (data: TeamFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate that at least one member is selected
    if (selectedUsers.length === 0) {
      setError("Please add at least one team member");
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
        "/teams/create/api",
        {
          name: form.getValues("name"),
          description: form.getValues("description"),
          img: imageSelection.imagePreview || "",
          members: memberEmails,
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
      form.reset();
      imageSelection.removeImage();
      setSelectedUsers([]);

      // Redirect to teams page after success
      setTimeout(() => {
        router.push(`/team/${data.data._id}`);
      }, 1000);
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
                            Description <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe what this team does and its main objectives..."
                              className="min-h-[100px] resize-none rounded-lg"
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            At least 10 characters
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
                        Team Members <span className="text-destructive">*</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add people to your team
                      </p>
                    </div>
                    <UserSelector
                      selectedUsers={selectedUsers}
                      onUsersChange={setSelectedUsers}
                      disabled={loading}
                      placeholder="Search by name or email..."
                    />
                    <FormDescription className="text-xs text-muted-foreground">
                      At least one member is required
                    </FormDescription>
                    {selectedUsers.length === 0 && error && (
                      <p className="text-sm font-medium text-destructive">
                        Please add at least one team member
                      </p>
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

