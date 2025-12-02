"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageSelector } from "@/components/ImageSelector";
import { useImageSelection } from "@/hooks/useImageSelection";
import { useAuth } from "@/lib/auth/AuthProvider";
import Loader from "@/components/Loader";
import { Team } from "@/types/team";

const updateTeamSchema = z.object({
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

type UpdateTeamFormData = z.infer<typeof updateTeamSchema>;

interface UpdateTeamSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onSuccess: () => void;
}

export function UpdateTeamSheet({
  open,
  onOpenChange,
  team,
  onSuccess,
}: UpdateTeamSheetProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageSelection = useImageSelection({
    maxSizeMB: 5,
    onError: (error) => setError(error),
  });

  const form = useForm<UpdateTeamFormData>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      name: team.name,
      description: team.description,
      img: team.img || "",
    },
  });

  // Update form when team changes
  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        description: team.description,
        img: team.img || "",
      });
      // Set the image preview if team has an image
      if (team.img) {
        imageSelection.setImagePreview(team.img);
      } else {
        imageSelection.setImagePreview(null);
      }
    }
  }, [team]);

  const onSubmit = async (data: UpdateTeamFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to update a team");
      }

      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error("Unauthorized");
      }

      const updateData: any = {
        name: data.name,
        description: data.description,
      };

      // Use the image preview (base64 or URL) if available
      if (imageSelection.imagePreview) {
        updateData.img = imageSelection.imagePreview;
      } else {
        updateData.img = "";
      }

      const response = await fetch(`/team/api?id=${team._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update team");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loader size="lg" hue={300} />
          </div>
        )}
        
        <SheetHeader>
          <SheetTitle>Update Team</SheetTitle>
          <SheetDescription>
            Update your team's image, name, and description
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
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
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your team..."
                      className="min-h-[120px] resize-y"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto sm:ml-auto"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Team"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

