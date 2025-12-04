"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast'; // Import showError

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRoles?: Array<"admin" | "faculty" | "staff" | "student">; // New prop for required roles
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute: Component Rendered.");
  console.log("ProtectedRoute: Current user object:", user);
  console.log("ProtectedRoute: Current user role:", user?.role);
  console.log("ProtectedRoute: Required roles for this route:", requiredRoles);

  if (loading) {
    console.log("ProtectedRoute: Auth loading...");
    return (
      <div className="flex flex-col space-y-3 p-6">
        <Skeleton className="h-[125px] w-[250px] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute: No user found, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  // Check for required roles if specified
  if (requiredRoles && user.role && !requiredRoles.includes(user.role)) {
    console.warn(`ProtectedRoute: User role '${user.role}' does not match any required roles: ${requiredRoles.join(', ')}. Redirecting to unauthorized.`);
    showError("You do not have permission to access this page.");
    return <Navigate to="/unauthorized" replace />; // Redirect to an unauthorized page
  }

  console.log(`ProtectedRoute: User role '${user.role}' is authorized for this route.`);
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;