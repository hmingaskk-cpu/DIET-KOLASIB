"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import *as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, // Added Form import
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
import { Loader2, Lock } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { UserProfile } from "@/pages/UserManagement"; // Assuming UserProfile is defined there
import { Student } from "./StudentTable";
import { Faculty } from "./FacultyTable";

const editUserFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["admin", "faculty", "staff", "student"], {
    message: "Please select a valid role.",
  }),
  name: z.string().min(1, { message: "Name is required." }).optional(), // Single name field
  // Conditional fields for student
  student_rollno: z.string().optional(),
  student_semester: z.coerce.number({ invalid_type_error: "Semester must be a number." }).min(1, { message: "Semester must be at least 1." }).max(4, { message: "Semester must be at most 4." }).optional(),
  student_status: z.enum(["active", "passed-out", "on-leave"], { message: "Invalid status." }).optional(),
  student_phone_number: z.string().optional(),
  student_address: z.string().optional(),

  // Conditional fields for faculty
  faculty_branch: z.string().optional(),
  faculty_abbreviation: z.string().optional(),
  faculty_phone: z.string().optional(),
  faculty_status: z.enum(["active", "on-leave", "retired"], { message: "Invalid status." }).optional(),

  // New fields for password change
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }).optional().or(z.literal('')),
  confirmNewPassword: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.role === "student") {
    if (!data.name || data.name.length < 2) { // Validate the single 'name' field
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Student Name must be at least 2 characters.",
        path: ["name"],
      });
    }
    if (!data.student_rollno || data.student_rollno.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Roll No. is required and must be at least 1 character.",
        path: ["student_rollno"],
      });
    }
    if (data.student_semester === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Semester is required for student role.",
        path: ["student_semester"],
      });
    }
    if (!data.student_status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Status is required for student role.",
        path: ["student_status"],
      });
    }
  }
  if (data.role === "faculty") {
    if (!data.name || data.name.length < 2) { // Validate the single 'name' field
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Faculty Name must be at least 2 characters.",
        path: ["name"],
      });
    }
    if (!data.faculty_branch || data.faculty_branch.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Branch is required and must be at least 2 characters.",
        path: ["faculty_branch"],
      });
    }
    if (!data.faculty_abbreviation || data.faculty_abbreviation.length !== 3 || !/^[A-Z]{3}$/.test(data.faculty_abbreviation)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Abbreviation must be 3 uppercase letters.",
        path: ["faculty_abbreviation"],
      });
    }
    if (!data.faculty_status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Status is required for faculty role.",
        path: ["faculty_status"],
      });
    }
  }
  // Password validation
  if (data.newPassword && data.newPassword.length > 0) {
    if (!data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please confirm your new password.",
        path: ["confirmNewPassword"],
      });
    } else if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmNewPassword"],
      });
    }
  }
});

export interface FullUserDetails {
  profile: UserProfile;
  student?: Student;
  faculty?: Faculty;
}

interface EditUserFormProps {
  initialData: FullUserDetails;
  onSuccess: (userId: string, role: string, newPassword?: string, name?: string, studentDetails?: any, facultyDetails?: any) => Promise<void>; // Updated onSuccess signature
  isLoading: boolean;
}

const EditUserForm = ({ initialData, onSuccess, isLoading }: EditUserFormProps) => {
  const form = useForm<z.infer<typeof editUserFormSchema>>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      email: initialData.profile.email,
      role: initialData.profile.role,
      name: initialData.profile.name || "", // Populate single name field
      student_rollno: initialData.student?.rollno || "",
      student_semester: initialData.student?.year || 1,
      student_status: initialData.student?.status || "active",
      student_phone_number: initialData.student?.phone_number || "",
      student_address: initialData.student?.address || "",
      faculty_branch: initialData.faculty?.branch || "",
      faculty_abbreviation: initialData.faculty?.abbreviation || "",
      faculty_phone: initialData.faculty?.phone || "",
      faculty_status: initialData.faculty?.status || "active",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const selectedRole = form.watch("role");

  const onSubmit = async (values: z.infer<typeof editUserFormSchema>) => {
    console.log("EditUserForm: onSubmit called with values:", values);

    const payload: any = {
      role: values.role,
      name: values.name, // Pass single name field
    };

    if (values.role === "student") {
      payload.studentDetails = {
        id: initialData.student?.id,
        name: values.name, // Use the single name field
        rollno: values.student_rollno,
        year: values.student_semester,
        status: values.student_status,
        course: "D.El.Ed", // Hardcode the course for students
        phone_number: values.student_phone_number || null,
        address: values.student_address || null,
      };
    } else if (values.role === "faculty") {
      payload.facultyDetails = {
        id: initialData.faculty?.id,
        name: values.name, // Use the single name field
        branch: values.faculty_branch,
        abbreviation: values.faculty_abbreviation?.toUpperCase(),
        phone: values.faculty_phone || null,
        status: values.faculty_status,
      };
    }

    await onSuccess(initialData.profile.id, payload.role, values.newPassword || undefined, payload.name, payload.studentDetails, payload.facultyDetails);
    form.reset({ // Reset only password fields after submission
      ...form.getValues(), // Keep other values
      newPassword: "",
      confirmNewPassword: "",
    });
  };

  const onError = (errors: any) => {
    console.error("EditUserForm: Form validation errors:", JSON.stringify(errors, null, 2));
    showError("Please correct the form errors.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled className="bg-gray-100 cursor-not-allowed" />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground flex items-center">
                <Lock className="h-3 w-3 mr-1" /> Email cannot be changed here.
              </p>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name" // Single name field
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder={selectedRole === "student" ? "John Doe" : selectedRole === "faculty" ? "Dr. Jane Doe" : "Admin/Staff Name"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedRole === "student" && (
          <>
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

        {selectedRole === "faculty" && (
          <>
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
                    <Input placeholder="+91 " {...field} />
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

        <div className="pt-4 border-t border-gray-200 mt-6">
          <h3 className="text-lg font-semibold mb-3 text-deep-blue">Change Password (Optional)</h3>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmNewPassword"
            render={({ field }) => (
              <FormItem className="mt-2">
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Update User"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default EditUserForm;