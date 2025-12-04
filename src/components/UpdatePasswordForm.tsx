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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabase";

const updatePasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Confirm password must be at least 6 characters.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

interface UpdatePasswordFormProps {
  onSuccess?: () => void;
}

const UpdatePasswordForm = ({ onSuccess }: UpdatePasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof updatePasswordSchema>) => {
    setIsLoading(true);
    console.log("UpdatePasswordForm: Starting password update for user.");

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      // If there's no explicit error from Supabase, assume success.
      // The AuthContext's onAuthStateChange listener will confirm the USER_UPDATED event.
      if (!error) {
        console.log("UpdatePasswordForm: Password update request sent successfully to Supabase (no explicit error).");
        showSuccess("Your password has been updated successfully!");
        form.reset();
        if (onSuccess) {
          console.log("UpdatePasswordForm: Calling onSuccess immediately.");
          onSuccess(); // Call onSuccess directly
        }
      } else {
        console.error("UpdatePasswordForm: Supabase update password error:", error);
        showError(error.message);
      }
    } catch (err: any) {
      console.error("UpdatePasswordForm: Unexpected error during password update:", err);
      showError(err.message || "An unexpected error occurred during password update.");
    } finally {
      console.log("UpdatePasswordForm: Finally block: Setting isLoading to false.");
      setIsLoading(false); // Ensure loading state is always reset
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </Form>
  );
};

export default UpdatePasswordForm;