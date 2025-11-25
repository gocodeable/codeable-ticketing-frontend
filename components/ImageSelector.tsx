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
      <div className="flex items-start gap-4">
        {/* Image Preview */}
        <div className="relative">
          <div
            className={`${sizeClass} ${shapeClass} border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center overflow-hidden`}
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
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={() => {
                removeImage();
                urlField?.onChange("");
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <div>
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
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
            {description && (
              <p className="text-xs text-muted-foreground mt-2">
                {description}
              </p>
            )}
          </div>

          {showUrlInput && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

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
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

