"use client";

import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-gray p-6 text-center">
      <ShieldOff className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-4xl font-bold mb-4 text-deep-blue">Access Denied</h1>
      <p className="text-xl text-gray-700 mb-6 max-w-2xl">
        You do not have the necessary permissions to view this page.
      </p>
      <Link to="/" className="text-app-green hover:underline text-lg">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;