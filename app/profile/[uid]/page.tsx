"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Mail,
  EditIcon,
  Loader2,
  Calendar,
  Clock,
  Briefcase,
  Users as UsersIcon,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPut } from "@/lib/api/apiClient";
import { UserInProjects } from "@/components/UserInProjects";
import { UserInTeams } from "@/components/UserInTeams";
import Loader from "@/components/Loader";
import { useImageSelection } from "@/hooks/useImageSelection";
import { ImageSelector } from "@/components/ImageSelector";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileCard from "@/components/ProfileCard";
import { updateProfile } from "firebase/auth";

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
        
        // Update Firebase user profile (displayName and photoURL)
        if (user) {
          try {
            await updateProfile(user, {
              displayName: formData.name,
              photoURL: avatarToSave || undefined,
            });
          } catch (firebaseError) {
            console.error("Error updating Firebase profile:", firebaseError);
          }
        }
        
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

  const isOwnProfile = user?.uid === uid;

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-3 hover:bg-muted/50 cursor-pointer rounded-lg"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
        </motion.div>

        {/* Profile Header */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <Card className="border-border/40 dark:border-border/70 rounded-xl">
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-32 mb-3" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1 hidden lg:block">
                <Skeleton className="w-full aspect-4/5 rounded-xl" />
              </div>
            </div>
          </motion.div>
        ) : userData ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* User Info Card */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-border/40 dark:border-border/70 rounded-xl">
                  <CardContent className="p-4">
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        {/* Avatar for mobile */}
                        <div className="relative lg:hidden">
                          <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border/40 dark:ring-border/60">
                            <Image
                              src={userData?.avatar || DEFAULT_AVATAR}
                              alt="Profile"
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isOwnProfile && (
                            <Button
                              size="icon"
                              onClick={handleOpenSheet}
                              className="absolute -bottom-1 -right-1 rounded-full w-7 h-7 bg-primary hover:bg-primary/90 shadow-lg"
                            >
                              <EditIcon className="w-3 h-3" />
                            </Button>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="text-lg font-semibold text-foreground mb-1">
                                {userData.name || "User"}
                              </h2>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" />
                                <p className="text-sm">
                                  {userData.email || "No email"}
                                </p>
                              </div>
                            </div>
                            {isOwnProfile && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleOpenSheet}
                                className="hidden lg:flex items-center gap-2 rounded-lg"
                              >
                                <EditIcon className="w-3.5 h-3.5" />
                                Edit Profile
                              </Button>
                            )}
                          </div>

                          {userData.bio && (
                            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                              {userData.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 pt-2.5 border-t border-border/40 dark:border-border/60">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Joined
                            </p>
                            <p className="text-xs font-medium text-foreground">
                              {formatDate(userData?.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/15">
                            <Clock className="w-4 h-4 text-green-600 dark:text-green-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Last active
                            </p>
                            <p className="text-xs font-medium text-foreground">
                              {formatDistanceToNow(
                                new Date(userData?.updatedAt as string)
                              )}{" "}
                              ago
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Projects and Teams */}
                {uid && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <UserInProjects uid={uid} />
                    <UserInTeams uid={uid} />
                  </motion.div>
                )}
              </div>

              {/* Profile Card - Desktop only */}
              <div className="lg:col-span-1 hidden lg:block">
                <ProfileCard
                  avatarUrl={userData?.avatar || DEFAULT_AVATAR}
                  name={userData?.name || "User"}
                  title={userData?.bio || "Team Member"}
                  showUserInfo={false}
                  enableTilt={true}
                  enableMobileTilt={false}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* Edit Profile Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader className="space-y-2 pb-6 border-b border-border/40 dark:border-border/60">
            <SheetTitle className="text-2xl font-bold">Edit Profile</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Update your profile information and avatar
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 py-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Profile Picture</Label>
              <ImageSelector
                imageSelection={imageSelection}
                shape="circle"
                size="lg"
                layout="vertical"
                description="Click to upload a new avatar (max 10MB)"
                showUrlInput={false}
                disabled={isSaving}
              />
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSaving}
                className="rounded-lg"
              />
            </div>

            {/* Bio Field */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                disabled={isSaving}
                className="resize-none rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                Brief description for your profile
              </p>
            </div>
          </div>

          <SheetFooter className="gap-2 pt-6 border-t border-border/40 dark:border-border/60">
            <Button
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              disabled={isSaving}
              className="flex-1 sm:flex-none rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="flex-1 sm:flex-none rounded-lg bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200"
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
