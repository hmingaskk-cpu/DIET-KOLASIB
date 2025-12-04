"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form, // Explicitly importing Form
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { showSuccess, showError } from "@/utils/toast";
import { Faculty } from "./FacultyTable";
import { FacultyListItem } from "@/pages/Faculty";

const facultyFormSchema = z.object({
  user_id: z.string().min(1, { message: "Please select a user or ensure user ID is provided." }),
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

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

interface AddFacultyFormProps {
  onSuccess?: (newFacultyData: Omit<Faculty, 'id' | 'created_at'>) => void;
  initialEmail?: string;
  initialProfileId?: string;
  existingFacultyProfiles: FacultyListItem[];
}

const AddFacultyForm = ({ onSuccess, initialEmail, initialProfileId, existingFacultyProfiles }: AddFacultyFormProps) => {
  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      user_id: initialProfileId || "",
      name: "",
      branch: "",
      abbreviation: "", // Default value for new field
      email: initialEmail || "",
      phone: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (initialProfileId) {
      form.setValue("user_id", initialProfileId);
      form.setValue("email", initialEmail || "");
      form.trigger("user_id");
      form.trigger("email");
    }
  }, [initialProfileId, initialEmail, form]);

  const onSubmit = (values: FacultyFormValues) => {
    console.log("New faculty member details to be added:", values);
    if (onSuccess) {
      onSuccess(values);
      form.reset();
    } else {
      console.error("onSuccess callback is not defined for AddFacultyForm");
      showError("An error occurred while submitting the form. Please try again.");
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    showError("Please correct the form errors.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
        {!initialProfileId && existingFacultyProfiles.length > 0 && (
          <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select User Profile</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const selectedProfile = existingFacultyProfiles.find(p => p.profile_id === value);
                    if (selectedProfile) {
                      form.setValue("email", selectedProfile.email || "");
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a faculty user" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {existingFacultyProfiles.map(profile => (
                      <SelectItem key={profile.profile_id} value={profile.profile_id || ""}>
                        {profile.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jane.doe@dietkolasib.org"
                  {...field}
                  disabled={!!initialProfileId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90">
          Add Faculty Details
        </Button>
      </form>
    </Form>
  );
};

export default AddFacultyForm;