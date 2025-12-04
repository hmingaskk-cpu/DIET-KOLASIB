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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const currentYear = new Date().getFullYear();

const addUserFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["admin", "faculty", "staff", "student"], {
    message: "Please select a valid role.",
  }),
  name: z.string().min(1, { message: "Name is required." }), // Single name field
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
});

interface AddUserFormProps {
  onSuccess?: (email: string, role: string, temporaryPassword: string, name: string, studentDetails?: any, facultyDetails?: any) => Promise<string | undefined>; // Updated onSuccess signature
  isLoading: boolean;
}

const generateTemporaryPassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const AddUserForm = ({ onSuccess, isLoading }: AddUserFormProps) => {
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const form = useForm<z.infer<typeof addUserFormSchema>>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      email: "",
      role: "student",
      name: "", // Single name field
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

  const selectedRole = form.watch("role");

  const onSubmit = async (values: z.infer<typeof addUserFormSchema>) => {
    console.log("AddUserForm: onSubmit called with values:", values);
    const tempPass = generateTemporaryPassword();
    setTemporaryPassword(""); // Clear previous password display immediately

    const payload: any = {
      email: values.email,
      password: tempPass,
      role: values.role,
      name: values.name, // Pass single name field
    };

    if (values.role === "student") {
      payload.studentDetails = {
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
        name: values.name, // Use the single name field
        branch: values.faculty_branch,
        abbreviation: values.faculty_abbreviation?.toUpperCase(),
        phone: values.faculty_phone,
        status: values.faculty_status,
      };
    }

    if (onSuccess) {
      console.log("AddUserForm: Calling onSuccess with payload:", payload);
      const createdTempPassword = await onSuccess(payload.email, payload.role, payload.password, payload.name, payload.studentDetails, payload.facultyDetails);
      if (createdTempPassword) {
        setTemporaryPassword(createdTempPassword); // Only set if creation was successful
        form.reset(); // Reset form fields on success
      }
    }
  };

  const onError = (errors: any) => {
    console.error("AddUserForm: Form validation errors:", JSON.stringify(errors, null, 2));
    showError("Please correct the form errors.");
  };

  const copyPasswordToClipboard = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      showSuccess("Temporary password copied to clipboard!");
    }
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
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value.toString()}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            "Create User"
          )}
        </Button>

        {temporaryPassword && (
          <div className="mt-4 p-3 border rounded-md bg-light-gray flex items-center justify-between">
            <span className="font-mono text-sm text-gray-800 break-all">{temporaryPassword}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyPasswordToClipboard}
              className="ml-2 p-2 h-8 w-8"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy password</span>
            </Button>
          </div>
        )}
        {temporaryPassword && (
          <p className="text-sm text-muted-foreground mt-2">
            Please provide this temporary password to the new user. They will be prompted to change it upon first login.
          </p>
        )}
      </form>
    </Form>
  );
};

export default AddUserForm;