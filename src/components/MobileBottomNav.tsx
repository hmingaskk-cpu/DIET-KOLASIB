"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { useAuth } from "@/context/AuthContext"; // Corrected import path

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Define a subset of nav items for the mobile bottom bar
  const mobileNavItems = [
    { name: "Dashboard", icon: navItems.find(item => item.name === "Dashboard")?.icon, path: "/", roles: ["admin", "faculty", "staff", "student"] },
    { name: "Students", icon: navItems.find(item => item.name === "Students")?.icon, path: "/students", roles: ["admin", "faculty", "staff"] },
    { name: "Attendance", icon: navItems.find(item => item.name === "Attendance")?.icon, path: "/attendance", roles: ["admin", "faculty", "staff"] },
    { name: "Calendar", icon: navItems.find(item => item.name === "Calendar")?.icon, path: "/calendar", roles: ["admin", "faculty", "staff", "student"] },
    { name: "Profile", icon: navItems.find(item => item.name === "Profile")?.icon, path: "/profile", roles: ["admin", "faculty", "staff", "student"] },
  ].filter(item => item.icon); // Filter out items if icon is not found

  if (!user) {
    return null; // Don't show if not logged in
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-deep-blue text-white h-16 flex justify-around items-center shadow-lg md:hidden">
      {mobileNavItems.map((item) => (
        item.roles.includes(user.role || "student") && (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center text-xs font-medium transition-colors h-full w-full",
              location.pathname === item.path
                ? "text-app-green" // Active color
                : "text-white hover:text-app-green/80" // Inactive color
            )}
          >
            {item.icon && <item.icon className="h-5 w-5 mb-1" />}
            <span>{item.name}</span>
          </Link>
        )
      ))}
    </nav>
  );
};

export default MobileBottomNav;