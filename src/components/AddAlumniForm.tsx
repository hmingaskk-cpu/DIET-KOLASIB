"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for temporary ID

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
import { showSuccess } from "@/utils/toast";
import { Alumni } from "@/pages/Alumni";
import ImageUpload from "@/components/ImageUpload"; // Import ImageUpload

const currentYear = new Date().getFullYear();

const alumniFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  graduation_year: z.coerce.number({ invalid_type_error: "Graduation year must be a number." })
    .min(1900, { message: "Year must be between 1900 and the current year." })
    .max(currentYear, { message: `Year must be between 1900 and ${currentYear}.` }),
  course: z.string().min(2, {
    message: "Course must be at least 2 characters.",
  }),
  contact_number: z.string().min(10, { message: "Contact number is required and must be at least 10 digits." }), // Made mandatory
  current_occupation: z.string().optional(),
  address: z.string().optional(), // New field for address
  avatar_url: z.string().optional().nullable(), // New field for avatar URL
  cloudinary_public_id: z.string().optional().nullable(), // New field for Cloudinary public ID
});

interface AddAlumniFormProps {
  onSuccess?: (newAlumniData: Omit<Alumni, 'id' | 'avatar_url' | 'cloudinary_public_id'>) => void;
}

const AddAlumniForm = ({ onSuccess }: AddAlumniFormProps) => {
  const [tempAlumniId] = useState(uuidv4()); // Generate a temporary ID for image upload folder
  const form = useForm<z.infer<typeof alumniFormSchema>>({
    resolver: zodResolver(alumniFormSchema),
    defaultValues: {
      name: "",
      email: "",
      graduation_year: currentYear,
      course: "",
      contact_number: "",
      current_occupation: "",
      address: "", // Default value for new field
      avatar_url: null,
      cloudinary_public_id: null,
    },
  });

  const onSubmit = (values: z.infer<typeof alumniFormSchema>) => {
    console.log("New alumni added:", values);
    showSuccess("Alumni record added successfully!");
    onSuccess?.(values);
    form.reset();
  };

  const handleUploadSuccess = async (imageUrl: string, publicId: string) => {
    form.setValue("avatar_url", imageUrl);
    form.setValue("cloudinary_public_id", publicId);
    form.trigger("avatar_url");
    form.trigger("cloudinary_public_id");
    showSuccess("Profile picture uploaded successfully!");
  };

  const handleRemoveSuccess = async () => {
    form.setValue("avatar_url", null);
    form.setValue("cloudinary_public_id", null);
    form.trigger("avatar_url");
    form.trigger("cloudinary_public_id");
    showSuccess("Profile picture removed successfully!");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col items-center mb-4">
          <ImageUpload
            currentImageUrl={form.watch("avatar_url")}
            currentPublicId={form.watch("cloudinary_public_id")}
            onUploadSuccess={handleUploadSuccess}
            onRemoveSuccess={handleRemoveSuccess}
            userId={tempAlumniId} // Use temporary ID for folder path
            label="Alumni Profile Picture (Optional)"
            className="w-full max-w-sm"
          />
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="graduation_year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Graduation Year</FormLabel>
              <FormControl>
                <Input type="number" placeholder={currentYear.toString()} {...field} onChange={e => field.onChange(e.target.value)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="course"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <FormControl>
                <Input placeholder="D.El.Ed" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input placeholder="+91 98765 43210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="current_occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Occupation (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Teacher at Govt. Primary School" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main St, City, State, Zip" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90">Add Alumni</Button>
      </form>
    </Form>
  );
};

export default AddAlumniForm;