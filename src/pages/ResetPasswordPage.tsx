"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UpdatePasswordForm from "@/components/UpdatePasswordForm"; // Import the reusable form

const ResetPasswordPage = () => {
  const navigate = useNavigate();

  const handlePasswordUpdateSuccess = () => {
    // The delay is now handled within UpdatePasswordForm, so this can navigate directly
    // after the form's internal delay.
    navigate("/login"); // Redirect to login after successful password update
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light-gray p-4">
      <h1 className="text-4xl font-bold mb-8 text-deep-blue">Set New Password</h1>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-deep-blue text-center">Enter Your New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm onSuccess={handlePasswordUpdateSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;