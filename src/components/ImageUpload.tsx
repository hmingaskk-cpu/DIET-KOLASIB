"use client";

import React, { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import imageCompression from "browser-image-compression";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabase"; // your Supabase client
import { uploadAvatarToCloudinary } from "@/lib/cloudinary"; // Import new avatar upload utility

interface ImageUploadProps {
  currentImageUrl?: string | null;
  currentPublicId?: string | null; // New prop for Cloudinary public_id
  onUploadSuccess: (imageUrl: string, publicId: string) => Promise<void>; // Updated signature
  onRemoveSuccess: () => Promise<void>;
  userId: string;
  label?: string;
  className?: string;
  canEdit?: boolean; // New prop to control editability
}

const ImageUpload = ({
  currentImageUrl,
  currentPublicId, // Use new prop
  onUploadSuccess,
  onRemoveSuccess,
  userId,
  label = "Profile Picture",
  className,
  canEdit = true, // Default to true, but will be explicitly set by parent components
}: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return; // Prevent action if not editable

    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(currentImageUrl || null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      showError("Only image files are allowed.");
      event.currentTarget.value = "";
      return;
    }

    const maxBeforeMB = 12;
    if (file.size > maxBeforeMB * 1024 * 1024) {
      showError(`Please choose an image smaller than ${maxBeforeMB} MB.`);
      event.currentTarget.value = "";
      return;
    }

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      setSelectedFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));

      setIsCompressing(false);
      setIsUploading(true);

      // Upload to Cloudinary
      const uploadResult = await uploadAvatarToCloudinary(compressedFile, `avatars/${userId}`);

      if (uploadResult) {
        await onUploadSuccess(uploadResult.secure_url, uploadResult.public_id);
        showSuccess("Avatar uploaded successfully!");
      } else {
        throw new Error("Cloudinary upload failed.");
      }
    } catch (err: any) {
      console.error("Error during image processing or upload:", err);
      showError(err?.message || "Image upload failed.");
      setSelectedFile(null);
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsCompressing(false);
      setIsUploading(false);

      const fileInput = document.getElementById("image-upload") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!canEdit) return; // Prevent action if not editable
    if (!userId || (!currentImageUrl && !selectedFile && !currentPublicId)) return;

    setIsUploading(true);
    try {
      const publicIdToDelete = currentPublicId;

      if (!publicIdToDelete) {
        showError("No public ID found to delete the image.");
        setIsUploading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-cloudinary-image", {
        body: {
          action: "delete",
          userId,
          publicId: publicIdToDelete,
        },
      });

      if (error) {
        console.error("Delete error:", error);
        showError(error.message || "Deletion failed.");
      } else if (data && data.success) {
        await onRemoveSuccess();
        showSuccess("Avatar removed successfully!");
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        console.error("Unexpected delete response:", data);
        showError("Deletion failed.");
      }
    } catch (err: any) {
      console.error("Edge function invocation error:", err);
      showError(err?.message || "Deletion failed.");
    } finally {
      setIsUploading(false);
      const fileInput = document.getElementById("image-upload") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    }
  };

  const isLoading = isCompressing || isUploading;

  return (
    <div className={cn("space-y-4", className)}>
      <Label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="flex items-center space-x-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-gray-100">
          {isLoading ? (
            <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
          ) : previewUrl ? (
            <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <UploadCloud className="h-12 w-12 text-gray-400" />
          )}
          {(previewUrl || selectedFile) && !isLoading && canEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
              onClick={handleRemoveImage}
            >
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          )}
        </div>
        <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="flex-1" disabled={isLoading || !canEdit} />
      </div>
      {isLoading && <p className="text-sm text-muted-foreground mt-2">{isCompressing ? "Compressing image..." : "Uploading..."}</p>}
      {!canEdit && <p className="text-sm text-red-500 mt-2">You do not have permission to change this profile picture.</p>}
    </div>
  );
};

export default ImageUpload;