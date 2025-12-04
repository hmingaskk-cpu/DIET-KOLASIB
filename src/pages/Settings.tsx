"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import UpdatePasswordForm from "@/components/UpdatePasswordForm"; // Import the new form
import BackupRestore from "@/components/BackupRestore"; // Import the new BackupRestore component
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const Settings = () => {
  const { user } = useAuth(); // Get the current user from AuthContext
  const isAdmin = user?.role === "admin"; // Check if the user is an admin

  return (
    <div className="px-0 py-6">
      <h1 className="text-3xl font-bold mb-6 text-deep-blue px-4">Settings</h1>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Configure application settings.
      </p>

      <div className="grid gap-6 max-w-md mx-auto px-4 sm:px-6">
        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Theme</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-700">Switch between light, dark, or system theme.</p>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-700 mb-4">Update your account password.</p>
            <UpdatePasswordForm />
          </CardContent>
        </Card>

        {/* New Backup & Restore Section - Only visible to admins */}
        {isAdmin && <BackupRestore />}
      </div>
    </div>
  );
};

export default Settings;