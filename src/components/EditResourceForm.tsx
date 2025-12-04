"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
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
import { showSuccess, showError } from "@/utils/toast";
import { uploadResourceToCloudinary } from "@/lib/cloudinary"; // Import new resource upload utility
import { Loader2 } from "lucide-react";
import { Resource } from "./AddResourceForm"; // Re-use Resource interface
import { supabase } from "@/lib/supabase";

const resourceFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  file: z.any()
    .optional() // File is optional for edit
    .refine((file) => !file || file instanceof File, "Invalid file type.")
    .refine((file) => !file || file.size <= 10 * 1024 * 1024, `File size should be less than 10MB.`)
    .refine((file) => !file || ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(file.type), "Unsupported file type."),
});

interface EditResourceFormProps {
  resource: Resource;
  onSuccess?: (updatedResourceData: Resource) => void;
}

const EditResourceForm = ({ resource, onSuccess }: EditResourceFormProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof resourceFormSchema>>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: resource.title,
      description: resource.description || "",
      file: undefined, // No file selected by default
    },
  });

  const onSubmit = async (values: z.infer<typeof resourceFormSchema>) => {
    setIsUploading(true);
    let newFileUrl = resource.file_url;
    let newPublicId = resource.cloudinary_public_id;

    try {
      if (values.file) {
        // If a new file is selected, upload it and delete the old one
        const folderPath = `resources/${resource.uploaded_by}/${resource.id}`; // Use existing resource ID for folder

        // Delete old file from Cloudinary
        if (resource.cloudinary_public_id) {
          const { data, error } = await supabase.functions.invoke("manage-cloudinary-image", {
            body: {
              action: "delete",
              userId: resource.uploaded_by, // Pass the uploader's ID for permission check
              publicId: resource.cloudinary_public_id,
            },
          });

          if (error) {
            console.error("Error invoking Cloudinary delete function for old resource:", error);
            showError(`Failed to delete old resource file: ${error.message}`);
            // Continue with new upload even if old deletion fails
          } else if (data && data.success) {
            showSuccess("Old resource file deleted from Cloudinary.");
          }
        }

        // Upload new file
        const uploadResult = await uploadResourceToCloudinary(values.file as File, folderPath);
        if (uploadResult) {
          newFileUrl = uploadResult.secure_url;
          newPublicId = uploadResult.public_id;
        } else {
          throw new Error("Failed to upload new file to Cloudinary.");
        }
      }

      const updatedResourceData: Resource = {
        ...resource,
        title: values.title,
        description: values.description,
        file_url: newFileUrl,
        cloudinary_public_id: newPublicId,
      };

      onSuccess?.(updatedResourceData);
    } catch (error: any) {
      console.error("Error during resource update:", error);
      showError(`Resource update failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource Title</FormLabel>
              <FormControl>
                <Input placeholder="Lecture Notes - Unit 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Brief description of the resource" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-sm text-muted-foreground">
          Current File: <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{resource.file_url.split('/').pop()}</a>
        </div>
        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Replace File (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(event) => {
                    onChange(event.target.files && event.target.files[0]);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90" disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Update Resource"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default EditResourceForm;