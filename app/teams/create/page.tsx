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
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Team Details</CardTitle>
              <CardDescription className="text-base">
                Fill in the information below to create your team
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Team Image Section */}
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
                          label="Team Icon"
                          description="Upload a square image (max 5MB)"
                          showUrlInput={true}
                          disabled={loading}
                        />
                      )}
                    />

                    {/* Name Field */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Name *</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter team name"
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your team..."
                              className="min-h-[120px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a clear description of your team's purpose
                            and goals
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Members Field */}
                    <div className="space-y-2">
                      <FormLabel>Add Members *</FormLabel>
                      <UserSelector
                        selectedUsers={selectedUsers}
                        onUsersChange={setSelectedUsers}
                        disabled={loading}
                        placeholder="Search users by name or email..."
                      />
                      <FormDescription>
                        Search and select team members. At least one member is required.
                      </FormDescription>
                      {selectedUsers.length === 0 && error && (
                        <p className="text-sm font-medium text-destructive">
                          At least one member is required
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
                          Team created successfully! Redirecting...
                        </p>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/50 mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => router.push("/teams")}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto sm:ml-auto shadow-sm hover:shadow-md transition-shadow"
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

