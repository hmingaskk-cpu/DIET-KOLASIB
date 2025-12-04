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
import { Course } from "./CourseTable"; // Import Course interface
import { useAutoSaveForm } from "@/hooks/useAutoSaveForm"; // Import the auto-save hook

const courseFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  code: z.string().min(3, {
    message: "Course code must be at least 3 characters.",
  }),
  instructor: z.string().min(2, {
    message: "Instructor name must be at least 2 characters.",
  }),
  credits: z.string().regex(/^\d+$/, {
    message: "Credits must be a number.",
  }).transform(Number),
  status: z.enum(["active", "inactive", "upcoming"], {
    message: "Please select a valid status.",
  }),
});

interface AddCourseFormProps {
  onSuccess?: (newCourseData: Omit<Course, 'id'>) => void;
}

const AddCourseForm = ({ onSuccess }: AddCourseFormProps) => {
  const defaultValues = {
    title: "",
    code: "",
    instructor: "",
    credits: 3,
    status: "active",
  };

  const form = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: defaultValues,
  });

  const { clearSavedData } = useAutoSaveForm({
    formName: "addCourseForm",
    control: form.control,
    defaultValues: defaultValues,
  });

  const onSubmit = (values: z.infer<typeof courseFormSchema>) => {
    console.log("New course added:", values);
    showSuccess("Course added successfully!");
    onSuccess?.(values);
    form.reset(defaultValues); // Reset form to default values
    clearSavedData(); // Clear auto-saved data on successful submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input placeholder="Introduction to Education" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Code</FormLabel>
              <FormControl>
                <Input placeholder="EDU101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instructor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructor</FormLabel>
              <FormControl>
                <Input placeholder="Dr. A. Lalremruata" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="credits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credits</FormLabel>
              <FormControl>
                <Input type="number" placeholder="3" {...field} onChange={e => field.onChange(e.target.value)} />
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
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90">Add Course</Button>
      </form>
    </Form>
  );
};

export default AddCourseForm;