"use client";

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabase";
import ImageUpload from "./ImageUpload";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton"; // Added import for Skeleton

const currentYear = new Date().getFullYear();

const editProfileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }).optional(), // Single name field
  avatar_url: z.string().optional().nullable(),
  cloudinary_public_id: z.string().optional().nullable(),

  // Student specific fields
  student_rollno: z.string().optional(),
  student_semester: z.coerce.number({ invalid_type_error: "Semester must be a number." }).min(1, { message: "Semester must be at least 1." }).max(4, { message: "Semester must be at most 4." }).optional(),
  student_status: z.enum(["active", "passed-out", "on-leave"], { message: "Invalid status." }).optional(),
  student_phone_number: z.string().optional(),
  student_address: z.string().optional(),

  // Faculty specific fields
  faculty_branch: z.string().optional(),
  faculty_abbreviation: z.string().optional(),
  faculty_phone: z.string().optional(),
  faculty_status: z.enum(["active", "on-leave", "retired"], { message: "Invalid status." }).optional(),
});

interface EditProfileFormProps {
  onSuccess: () => void;
}

const EditProfileForm = ({ onSuccess }: EditProfileFormProps) => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState<any | null>(null);
  const [facultyDetails, setFacultyDetails] = useState<any | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const form = useForm<z.infer<typeof editProfileFormSchema>>({
    resolver: zodResolver(editProfileFormSchema),
    defaultValues: {
      name: user?.name || "", // Use single name field
      avatar_url: user?.avatar_url || null,
      cloudinary_public_id: null, // This will be fetched or set by ImageUpload
      student_rollno: "",
      student_semester: 1,
      student_status: "active",
      student_phone_number: "",
      student_address: "",
      faculty_branch: "",
      faculty_abbreviation: "",
      faculty_phone: "",
      faculty_status: "active",
    },
  });

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.id) return;

      setDataLoading(true);
      try {
        // Fetch profile details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, avatar_url, cloudinary_public_id') // Fetch 'name'
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        form.reset({
          name: profileData.name || "", // Use 'name'
          avatar_url: profileData.avatar_url || null,
          cloudinary_public_id: profileData.cloudinary_public_id || null,
        });

        // Fetch role-specific details
        if (user.role === "student") {
          const { data, error } = await supabase.from('students').select('*').eq('user_id', user.id).single();
          if (error && error.code !== 'PGRST116') throw error;
          setStudentDetails(data);
          if (data) {
            form.setValue("student_rollno", data.rollno || "");
            form.setValue("student_semester", data.year || 1);
            form.setValue("student_status", data.status || "active");
            form.setValue("student_phone_number", data.phone_number || "");
            form.setValue("student_address", data.address || "");
          }
        } else if (user.role === "faculty") {
          const { data, error } = await supabase.from('faculty').select('*').eq('user_id', user.id).single();
          if (error && error.code !== 'PGRST116') throw error;
          setFacultyDetails(data);
          if (data) {
            form.setValue("faculty_branch", data.branch || "");
            form.setValue("faculty_abbreviation", data.abbreviation || "");
            form.setValue("faculty_phone", data.phone || "");
            form.setValue("faculty_status", data.status || "active");
          }
        }
      } catch (err: any) {
        console.error("Error fetching profile details for edit:", err);
        showError(`Failed to load profile details: ${err.message}`);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDetails();
  }, [user, form]);

  const handleUploadSuccess = async (imageUrl: string, publicId: string) => {
    if (!user?.id) return; // Use user.id from AuthContext

    const { error } = await supabase.from('profiles').update({ avatar_url: imageUrl, cloudinary_public_id: publicId }).eq('id', user.id);
    if (error) {
      console.error("Error updating profile avatar_url in DB:", error);
      showError("Failed to save avatar URL to database.");
    } else {
      showSuccess("Profile picture updated successfully!");
      refreshUser(); // Refresh auth context user
    }
  };

  const handleRemoveSuccess = async () => {
    if (!user?.id) return; // Use user.id from AuthContext

    const { error } = await supabase.from('profiles').update({ avatar_url: null, cloudinary_public_id: null }).eq('id', user.id);
    if (error) {
      console.error("Error removing profile avatar_url from DB:", error);
      showError("Failed to remove avatar URL from database.");
    } else {
      showSuccess("Profile picture removed successfully!");
      refreshUser(); // Refresh auth context user
    }
  };

  const onSubmit = async (values: z.infer<typeof editProfileFormSchema>) => {
    if (!user?.id) {
      showError("User not authenticated.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update public.profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          name: values.name, // Update 'name'
          // avatar_url and cloudinary_public_id are handled by ImageUpload directly
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      // 2. Update role-specific tables
      if (user.role === "student" && studentDetails) {
        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({
            name: values.name, // Use the single name field
            rollno: values.student_rollno,
            year: values.student_semester,
            status: values.student_status,
            phone_number: values.student_phone_number,
            address: values.student_address,
          })
          .eq('user_id', user.id);
        if (studentUpdateError) throw studentUpdateError;
      } else if (user.role === "faculty" && facultyDetails) {
        const { error: facultyUpdateError } = await supabase
          .from('faculty')
          .update({
            name: values.name, // Use the single name field
            branch: values.faculty_branch,
            abbreviation: values.faculty_abbreviation?.toUpperCase(),
            phone: values.faculty_phone,
            status: values.faculty_status,
          })
          .eq('user_id', user.id);
        if (facultyUpdateError) throw facultyUpdateError;
      }

      showSuccess("Profile updated successfully!");
      refreshUser(); // Refresh the user data in AuthContext
      onSuccess();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      showError(`Failed to update profile: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (dataLoading || authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {user?.id && (
          <ImageUpload
            currentImageUrl={form.watch("avatar_url")}
            currentPublicId={form.watch("cloudinary_public_id")}
            onUploadSuccess={handleUploadSuccess}
            onRemoveSuccess={handleRemoveSuccess}
            userId={user.id}
            label="Profile Picture"
            className="mb-4"
            canEdit={true} // Always editable for own profile
          />
        )}

        <FormField
          control={form.control}
          name="name" // Single name field
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {user?.role === "student" && studentDetails && (
          <>
            <h3 className="text-lg font-semibold mt-6 mb-2 text-deep-blue">Student Details</h3>
            <FormField
              control={form.control}
              name="student_rollno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll No.</FormLabel>
                  <FormControl>
                    <Input placeholder="DIET/2024/001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_semester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1st Semester</SelectItem>
                      <SelectItem value="2">2nd Semester</SelectItem>
                      <SelectItem value="3">3rd Semester</SelectItem>
                      <SelectItem value="4">4th Semester</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="passed-out">Passed Out</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_address"
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
          </>
        )}

        {user?.role === "faculty" && facultyDetails && (
          <>
            <h3 className="text-lg font-semibold mt-6 mb-2 text-deep-blue">Faculty Details</h3>
            <FormField
              control={form.control}
              name="faculty_branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <FormControl>
                    <Input placeholder="Science & Math" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faculty_abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abbreviation (3 uppercase letters)</FormLabel>
                  <FormControl>
                    <Input placeholder="JDO" {...field} maxLength={3} className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faculty_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faculty_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default EditProfileForm;