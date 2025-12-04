"use client";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { navItems } from "@/lib/nav-items";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-deep-blue text-white shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          DIET KOLASIB
        </Link>
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm flex items-center">
                <User className="h-4 w-4 mr-1" /> {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading} className="text-white hover:bg-deep-blue/80">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-deep-blue/80">
                Login
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-deep-blue/80">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] bg-deep-blue text-white p-4">
              <Link to="/" className="flex items-center justify-center text-2xl font-bold tracking-tight mb-6">
                DIET KOLASIB
              </Link>
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  // Only render if the user's role is included in the item's allowed roles
                  user && item.roles.includes(user.role || "student") && (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="flex items-center space-x-3 py-2 px-4 hover:bg-deep-blue/80 rounded-md transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                ))}
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 py-2 px-4 text-sm">
                      <User className="h-5 w-5" />
                      <span>{user.email}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading} className="w-full justify-start text-white hover:bg-deep-blue/80">
                      <LogOut className="mr-2 h-5 w-5" /> Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-deep-blue/80">
                      Login
                    </Button>
                  </Link>
                )}
              </nav>
              <div className="mt-6 flex justify-center">
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;