"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { ArrowLeft, Mail, EditIcon, Loader2, Dot } from "lucide-react";
import { useEffect, use, useState } from "react";
import { User as UserType } from "@/types/user";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProfileCard from "@/components/ProfileCard";
import { apiGet, apiPut } from "@/lib/api/apiClient";
import { UserInProjects } from "@/components/UserInProjects";
import { UserInTeams } from "@/components/UserInTeams";
import Loader from "@/components/Loader";
import { useImageSelection } from "@/hooks/useImageSelection";
import { ImageSelector } from "@/components/ImageSelector";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Default avatar image path
const DEFAULT_AVATAR = "/user.jpg";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { user } = useAuth();
  const { uid } = use(params);
  const router = useRouter();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar: "",
  });

  const imageSelection = useImageSelection({
    maxSizeMB: 10,
  });

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const idToken = await user?.getIdToken();
      const response = await apiGet(`/api/user?uid=${uid}`, idToken, {
        next: {
          revalidate: 60,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      setUserData(data.data);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchUser();
  }, [uid]);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        bio: userData.bio || "",
        avatar: userData.avatar || "",
      });
      if (userData.avatar) {
        imageSelection.setImagePreview(userData.avatar);
      }
    }
  }, [userData]);

  const handleOpenSheet = () => {
    setIsSheetOpen(true);
  };

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      const idToken = await user?.getIdToken();
      
      // Use the image preview from the hook (either file or existing avatar)
      const avatarToSave = imageSelection.imagePreview || formData.avatar;
      
      const response = await apiPut(
        `/api/user`,
        {
          name: formData.name,
          bio: formData.bio,
          avatar: avatarToSave,
        },
        idToken
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      if (data.success) {
        setUserData(data.data);
        setIsSheetOpen(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader size="md" hue={300} />
      </div>  
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background grid grid-cols-1 md:grid-cols-3">
      <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-4xl md:max-w-6xl col-span-1 md:col-span-2">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {isLoading ? (
            <Card className="mb-6 border-border/50 shadow-sm pt-1">
              <CardContent className="py-6">
                {user?.uid === uid && (
                  <div className="flex items-center justify-end mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                )}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Avatar Skeleton */}
                  <div className="relative mb-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                  </div>

                  {/* User Info Skeleton */}
                  <div className="flex-1 text-center md:text-left space-y-3">
                    <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                    <Skeleton className="h-5 w-64 mx-auto md:mx-0" />
                    <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
                  </div>
                </div>
                <div className="flex items-center justify-center sm:justify-end mt-4">
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardContent>
            </Card>
          ) : userData ? (
            <Card className="mb-6 border-border/50 shadow-sm pt-1">
              <CardContent className={user?.uid === uid ? "" : "pt-6"}>
                {user?.uid === uid && (
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenSheet}
                      className="rounded-full cursor-pointer shrink-0 hover:bg-muted/50 hover:text-primary"
                    >
                      <EditIcon className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="h-24 w-24 rounded-full bg-linear-to-br from-primary/80 to-primary flex items-center justify-center text-4xl font-bold text-primary-foreground shadow-md ring-4 ring-background overflow-hidden">
                      <Image
                        src={userData?.avatar || DEFAULT_AVATAR}
                        alt="Profile"
                        width={100}
                        height={100}
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                      {userData.name || "User"}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mb-3">
                      <Mail className="h-4 w-4" />
                      <p className="text-base">
                        {userData.email || "No email"}
                      </p>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start text-green-400 dark:text-green-600">
                      <Dot className="h-8 w-8" />
                      <p className="text-xs font-semibold">
                        {formatDistanceToNow(
                          new Date(userData?.updatedAt as string)
                        )}{" "}
                        ago
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center sm:justify-end">
                  <p className="text-sm font-medium text-muted-foreground">
                    Joined {formatDate(userData?.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </motion.div>

        {/* User Projects and Teams */}
        {uid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <UserInProjects uid={uid} />
            <UserInTeams uid={uid} />
          </motion.div>
        )}
      </div>
      <div className="container mx-auto w-full flex items-center justify-center py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {isLoading ? (
            <Card className="w-80 h-96">
              <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardContent>
            </Card>
          ) : (
            <ProfileCard
              name={userData?.name || ""}
              title={userData?.bio || ""}
              avatarUrl={userData?.avatar || DEFAULT_AVATAR}
              showUserInfo={false}
              enableTilt={true}
              enableMobileTilt={false}
            />
          )}
        </motion.div>
      </div>

      {/* Edit Profile Side Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto p-2 sm:p-4">
          <SheetHeader className="space-y-2">
            <SheetTitle className="text-2xl">Edit Profile</SheetTitle>
            <SheetDescription className="text-base">
              Update your profile information. Changes will be saved to your
              account.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 py-6">
            {/* Avatar Preview */}
            <ImageSelector
              imageSelection={imageSelection}
              shape="circle"
              size="lg"
              layout="vertical"
              description="Click to upload a new avatar"
              showUrlInput={false}
              disabled={isSaving}
            />

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Bio Field */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          <SheetFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
