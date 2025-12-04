"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';

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
import { useAuth } from "@/context/AuthContext";

const resourceFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  file: z.any()
    .refine((file) => file instanceof File, "A file is required.")
    .refine((file) => file && file.size <= 10 * 1024 * 1024, `File size should be less than 10MB.`)
    .refine((file) => file && ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(file.type), "Unsupported file type."),
});

export interface Resource {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  cloudinary_public_id: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

interface AddResourceFormProps {
  onSuccess?: (newResourceData: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => void;
}

const AddResourceForm = ({ onSuccess }: AddResourceFormProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [tempResourceId] = useState(uuidv4()); // Generate a temporary ID for Cloudinary folder

  const form = useForm<z.infer<typeof resourceFormSchema>>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof resourceFormSchema>) => {
    if (!user?.id) {
      showError("You must be logged in to upload resources.");
      return;
    }

    setIsUploading(true);
    try {
      const file = values.file as File;
      const folderPath = `resources/${user.id}/${tempResourceId}`; // Unique folder per resource

      const uploadResult = await uploadResourceToCloudinary(file, folderPath);

      if (uploadResult) {
        const newResourceData: Omit<Resource, 'id' | 'created_at' | 'updated_at'> = {
          title: values.title,
          description: values.description,
          file_url: uploadResult.secure_url,
          cloudinary_public_id: uploadResult.public_id,
          uploaded_by: user.id,
        };
        onSuccess?.(newResourceData);
        form.reset();
      } else {
        showError("Failed to upload file to Cloudinary.");
      }
    } catch (error: any) {
      console.error("Error during resource upload:", error);
      showError(`Resource upload failed: ${error.message}`);
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
        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
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
            "Upload Resource"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddResourceForm;