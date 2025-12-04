"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <aside
        className={cn(
          "hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4",
          className
        )}
      >
        <div className="flex items-center justify-center h-16 border-b border-sidebar-border mb-4">
          <h2 className="text-xl font-semibold text-sidebar-primary">DIET KOLASIB</h2>
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
          <Skeleton className="h-8 w-full bg-sidebar-accent rounded-md" />
        </div>
      </aside>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4",
        className
      )}
    >
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border mb-4">
        <h2 className="text-xl font-semibold text-sidebar-primary">DIET KOLASIB</h2>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          // Only render if the user's role is included in the item's allowed roles
          item.roles.includes(user.role || "student") && (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 p-2 rounded-md transition-colors",
                location.pathname === item.path
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;