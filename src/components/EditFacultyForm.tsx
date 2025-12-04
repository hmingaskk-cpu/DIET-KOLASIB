"use client";

import React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess } from "@/utils/toast";
import { Faculty } from "./FacultyTable";
import { useAutoSaveForm } from "@/hooks/useAutoSaveForm"; // Import the auto-save hook

const facultyFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  branch: z.string().min(2, {
    message: "Branch must be at least 2 characters.",
  }),
  abbreviation: z.string().length(3, { message: "Abbreviation must be 3 characters." }).regex(/^[A-Z]{3}$/, { message: "Abbreviation must be 3 uppercase letters." }), // New field
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  status: z.enum(["active", "on-leave", "retired"], {
    message: "Please select a valid status.",
  }),
});

interface EditFacultyFormProps {
  faculty: Faculty;
  onSuccess?: (updatedFacultyData: Faculty) => void;
}

const EditFacultyForm = ({ faculty, onSuccess }: EditFacultyFormProps) => {
  const defaultValues = {
    name: faculty.name,
    branch: faculty.branch,
    abbreviation: faculty.abbreviation || "", // Default value for new field
    email: faculty.email,
    phone: faculty.phone || "",
    status: faculty.status,
  };

  const form = useForm<z.infer<typeof facultyFormSchema>>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: defaultValues,
  });

  const { clearSavedData } = useAutoSaveForm({
    formName: `editFacultyForm_${faculty.id}`, // Unique name for each faculty
    control: form.control,
    defaultValues: defaultValues,
  });

  const onSubmit = (values: z.infer<typeof facultyFormSchema>) => {
    console.log("Faculty updated:", values);
    showSuccess("Faculty updated successfully!");
    onSuccess?.({ ...faculty, ...values });
    clearSavedData(); // Clear auto-saved data on successful submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faculty Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="branch"
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
          name="abbreviation"
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane.doe@dietkolasib.org" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
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
          name="status"
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
        <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90">Update Faculty</Button>
      </form>
    </Form>
  );
};

export default EditFacultyForm;