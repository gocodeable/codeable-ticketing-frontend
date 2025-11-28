"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Upload, X, Image as ImageIcon, Pencil } from "lucide-react";
import { ImageSelectionReturn } from "@/hooks/useImageSelection";
import { ControllerRenderProps } from "react-hook-form";

interface ImageSelectorProps {
  imageSelection: ImageSelectionReturn;
  urlField?: ControllerRenderProps<any, any>;
  shape?: "square" | "circle";
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
  label?: string;
  description?: string;
  showUrlInput?: boolean;
  disabled?: boolean;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const shapeClasses = {
  square: "rounded-lg",
  circle: "rounded-full",
};

export function ImageSelector({
  imageSelection,
  urlField,
  shape = "square",
  size = "md",
  layout = "horizontal",
  label,
  description,
  showUrlInput = true,
  disabled = false,
}: ImageSelectorProps) {
  const {
    imagePreview,
    imageFile,
    fileInputRef,
    handleImageFileSelect,
    handleImageUrlChange,
    removeImage,
  } = imageSelection;

  const sizeClass = sizeClasses[size];
  const shapeClass = shapeClasses[shape];

  // Vertical layout (profile-style)
  if (layout === "vertical") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`${sizeClass} ${shapeClass} bg-linear-to-br from-primary/80 to-primary flex items-center justify-center text-4xl font-bold text-primary-foreground shadow-xl ring-4 ring-background ${
              !disabled ? "cursor-pointer" : ""
            } transition-all hover:ring-primary/50 overflow-hidden`}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Selected image"
                className={`w-full h-full ${shapeClass} object-cover`}
              />
            ) : (
              <ImageIcon className="w-1/2 h-1/2 text-primary-foreground/40" />
            )}
          </div>
          {/* Pencil Icon Overlay */}
          {!disabled && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Pencil className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground text-center">
            {description}
          </p>
        )}
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  // Horizontal layout (project/team-style)
  return (
    <div className="space-y-4">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {/* Centered Upload Area */}
      <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed border-border/40 dark:border-border/60 bg-muted/20 dark:bg-muted/10 rounded-xl hover:border-primary/40 dark:hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/5 transition-all duration-200">
        {/* Image Preview */}
        <div className="relative">
          <div
            onClick={() => !disabled && !imagePreview && fileInputRef.current?.click()}
            className={`${sizeClass} ${shapeClass} border-2 ${
              imagePreview
                ? "border-border/40 dark:border-border"
                : "border-dashed border-border/40 dark:border-border/60"
            } bg-background dark:bg-background flex items-center justify-center overflow-hidden ${
              !disabled && !imagePreview ? "cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/5" : ""
            } transition-all duration-200`}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
            )}
          </div>
          {imagePreview && !disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg"
              onClick={() => {
                removeImage();
                urlField?.onChange("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Upload Button and Description */}
        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="rounded-lg border-border/40 dark:border-border hover:bg-primary/10 dark:hover:bg-primary/10 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200"
          >
            <Upload className="w-4 h-4 mr-2" />
            {imagePreview ? "Change Image" : "Upload Image"}
          </Button>
          {description && (
            <p className="text-xs text-muted-foreground text-center">
              {description}
            </p>
          )}
        </div>

        {showUrlInput && (
          <>
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40 dark:border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-muted/20 dark:bg-muted/10 px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="w-full max-w-xs">
              {urlField ? (
                <FormItem>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="Enter image URL"
                      {...urlField}
                      onChange={(e) => {
                        urlField.onChange(e);
                        handleImageUrlChange(e.target.value);
                      }}
                      disabled={disabled || !!imageFile}
                      className="rounded-lg border-border/40 dark:border-border text-center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) : (
                <Input
                  type="url"
                  placeholder="Enter image URL"
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  disabled={disabled || !!imageFile}
                  className="rounded-lg border-border/40 dark:border-border text-center"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

