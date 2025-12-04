"use client";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { authFormSchema } from "@/components/AuthForm"; // Import the schema

const Signup = () => {
  const { signUp, loading, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate("/"); // Redirect to dashboard if already logged in
    }
  }, [user, navigate]);

  const handleSubmit = async (values: z.infer<typeof authFormSchema>) => {
    // Only pass email and password to signUp, role is now handled internally by AuthContext
    await signUp(values.email, values.password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light-gray p-4">
      <h1 className="text-4xl font-bold mb-8 text-deep-blue">Join DIET KOLASIB</h1>
      <AuthForm type="signup" onSubmit={handleSubmit} isLoading={loading} />
      <p className="mt-4 text-gray-700">
        Already have an account?{" "}
        <Link to="/login" className="text-app-green hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};

export default Signup;