"use client";

import { showError } from "@/utils/toast";

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

// Function specifically for uploading image avatars
export const uploadAvatarToCloudinary = async (file: File, folder: string): Promise<CloudinaryUploadResponse | null> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    showError("Cloudinary configuration missing. Please check environment variables.");
    console.error("Cloudinary config missing: VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder); // Specify the folder in Cloudinary
  formData.append("resource_type", "image"); // Explicitly set for images

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary avatar upload error (full response):", errorData);
      showError(`Avatar upload failed: ${errorData.error?.message || response.statusText}`);
      return null;
    }

    const data: CloudinaryUploadResponse = await response.json();
    return { secure_url: data.secure_url, public_id: data.public_id };
  } catch (error: any) {
    console.error("Network error during Cloudinary avatar upload:", error);
    showError(`Network error during avatar upload: ${error.message}`);
    return null;
  }
};

// Function for uploading general resources (can be images, PDFs, docs, etc.)
export const uploadResourceToCloudinary = async (file: File, folder: string): Promise<CloudinaryUploadResponse | null> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    showError("Cloudinary configuration missing. Please check environment variables.");
    console.error("Cloudinary config missing: VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder); // Specify the folder in Cloudinary
  formData.append("resource_type", "auto"); // Automatically detect resource type

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { // Use /auto/upload endpoint
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary resource upload error (full response):", errorData);
      showError(`Resource upload failed: ${errorData.error?.message || response.statusText}`);
      return null;
    }

    const data: CloudinaryUploadResponse = await response.json();
    return { secure_url: data.secure_url, public_id: data.public_id };
  } catch (error: any) {
    console.error("Network error during Cloudinary resource upload:", error);
    showError(`Network error during resource upload: ${error.message}`);
    return null;
  }
};