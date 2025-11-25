import { useState, useRef } from "react";

export interface ImageSelectionOptions {
  maxSizeMB?: number;
  onError?: (error: string) => void;
}

export interface ImageSelectionReturn {
  imagePreview: string | null;
  imageFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUrlChange: (url: string) => void;
  removeImage: () => void;
  setImagePreview: (preview: string | null) => void;
}

export function useImageSelection(
  options: ImageSelectionOptions = {}
): ImageSelectionReturn {
  const { maxSizeMB = 5, onError } = options;
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      onError?.("Please select a valid image file");
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      onError?.(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (url: string) => {
    if (url) {
      setImagePreview(url);
      setImageFile(null); // Clear file when URL is entered
    } else {
      if (!imageFile) {
        setImagePreview(null);
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    imagePreview,
    imageFile,
    fileInputRef,
    handleImageFileSelect,
    handleImageUrlChange,
    removeImage,
    setImagePreview,
  };
}

