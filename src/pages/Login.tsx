"use client";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { authFormSchema } from "@/components/AuthForm"; // Import the schema

const Login = () => {
  const { signIn, loading, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      navigate("/"); // Redirect to dashboard if already logged in
    }
  }, [user, navigate]);

  const handleSubmit = async (values: z.infer<typeof authFormSchema>) => {
    setError(null);
    try {
      // Pass email, password, and rememberMe to signIn
      await signIn(values.email, values.password, values.rememberMe);
      // The redirect will happen automatically via useEffect above
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light-gray p-4">
      <h1 className="text-4xl font-bold mb-8 text-deep-blue">DIET KOLASIB</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <AuthForm type="login" onSubmit={handleSubmit} isLoading={loading} />
      
      <p className="mt-4 text-gray-700">
        Don't have an account? Please contact an administrator to create one.
      </p>
      <p className="mt-2 text-gray-700">
        <Link to="/forgot-password" className="text-blue-600 hover:underline">
          Forgot Password?
        </Link>
      </p>
    </div>
  );
};

export default Login;
