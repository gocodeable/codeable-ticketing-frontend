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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageSelector } from "@/components/ImageSelector";
import { useImageSelection } from "@/hooks/useImageSelection";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Project } from "@/types/project";
import { generateProjectCode } from "@/utils/generateProjectCode";
import Image from "next/image";

const updateProjectSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be less than 10 characters")
    .regex(/^[A-Z][A-Z0-9]*$/, "Code must start with a letter and contain only uppercase letters and numbers"),
  description: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      // Strip HTML tags and check text content length
      const textContent = val.replace(/<[^>]*>/g, '').trim();
      // If content exists, it must be at least 10 characters
      return textContent.length >= 10;
    }, "Description must have at least 10 characters of text content")
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      // Strip HTML tags and check text content length
      const textContent = val.replace(/<[^>]*>/g, '').trim();
      return textContent.length <= 5000;
    }, "Description must be less than 5000 characters of text content")
    .or(z.literal("")),
  img: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        // Allow data URLs for image uploads
        if (val.startsWith("data:image/")) return true;
        // Allow HTTP/HTTPS URLs for existing stored images
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
  docsType: z
    .enum(["firebase", "swagger"])
    .optional(),
  devDocsLink: z
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
  prodDocsLink: z
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

type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

interface UpdateProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess: () => void;
}

export function UpdateProjectSheet({
  open,
  onOpenChange,
  project,
  onSuccess,
}: UpdateProjectSheetProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageSelection = useImageSelection({
    maxSizeMB: 5,
    onError: (error) => setError(error),
  });

  const form = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      title: project.title,
      code: project.code,
      description: project.description,
      figmaLink: project.figmaLink || "",
      swaggerLink: project.swaggerLink || "",
      docsType: project.docsType || "swagger",
      devDocsLink: project.devDocsLink || "",
      prodDocsLink: project.prodDocsLink || (project.swaggerLink || ""),
    },
  });

  // Update form when project changes
  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title,
        code: project.code,
        description: project.description,
        figmaLink: project.figmaLink || "",
        swaggerLink: project.swaggerLink || "",
        docsType: project.docsType || "swagger",
        devDocsLink: project.devDocsLink || "",
        prodDocsLink: project.prodDocsLink || (project.swaggerLink || ""),
      });
      // Set the image preview if project has an image
      if (project.img) {
        imageSelection.setImagePreview(project.img);
      } else {
        imageSelection.setImagePreview(null);
      }
    }
  }, [project]);

  const onSubmit = async (data: UpdateProjectFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to update a project");
      }

      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error("Unauthorized");
      }

      const updateData: any = {
        title: data.title,
        code: data.code.toUpperCase(),
        description: data.description,
        figmaLink: data.figmaLink || undefined,
        swaggerLink: data.swaggerLink || undefined,
        docsType: data.docsType || undefined,
        devDocsLink: data.devDocsLink || undefined,
        prodDocsLink: data.prodDocsLink || undefined,
      };

      // Use the image preview (base64 or URL) if available
      if (imageSelection.imagePreview) {
        updateData.img = imageSelection.imagePreview;
      } else {
        updateData.img = "";
      }

      const response = await fetch(`/project/api?id=${project._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle>Update Project</SheetTitle>
          <SheetDescription>
            Update your project's details, image, and external links
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            {/* Project Image Section */}
            <div>
              <ImageSelector
                imageSelection={imageSelection}
                shape="square"
                size="md"
                layout="horizontal"
                label="Project Icon"
                description="Upload a square image (max 5MB)"
                showUrlInput={false}
                disabled={loading}
              />
            </div>

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
                      disabled={loading}
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

            {/* Code Field */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Code *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g., PROJ"
                      disabled={loading}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Describe your project..."
                      disabled={loading}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Figma Link Field */}
            <FormField
              control={form.control}
              name="figmaLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Figma Link (Optional)</FormLabel>
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
                        disabled={loading}
                        {...field}
                        className="pl-9"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Documentation Type Selector */}
            <FormField
              control={form.control}
              name="docsType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documentation Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select documentation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="swagger">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/swagger.png"
                            alt="Swagger"
                            width={16}
                            height={16}
                          />
                          <span>Swagger</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="firebase">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/firebase.png"
                            alt="Firebase"
                            width={16}
                            height={16}
                          />
                          <span>Firebase</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional DEV and PROD Docs Links */}
            {form.watch("docsType") && (
              <>
                <FormField
                  control={form.control}
                  name="devDocsLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DEV docs</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Image
                            src={
                              form.watch("docsType") === "firebase"
                                ? "/firebase.png"
                                : "/swagger.png"
                            }
                            alt={form.watch("docsType") || "Docs"}
                            width={16}
                            height={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          />
                          <Input
                            type="url"
                            placeholder="https://dev-docs..."
                            disabled={loading}
                            {...field}
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prodDocsLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PROD docs</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Image
                            src={
                              form.watch("docsType") === "firebase"
                                ? "/firebase.png"
                                : "/swagger.png"
                            }
                            alt={form.watch("docsType") || "Docs"}
                            width={16}
                            height={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          />
                          <Input
                            type="url"
                            placeholder="https://prod-docs..."
                            disabled={loading}
                            {...field}
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
                {loading ? "Updating..." : "Update Project"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

