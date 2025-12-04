"use client";

import React from "react";
import { Outlet } from "react-router-dom"; // Import Outlet
import Header from "../Header";
import Sidebar from "../Sidebar";
import Footer from "../Footer";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import MobileBottomNav from "../MobileBottomNav"; // New import

// Remove children prop from interface as it's not directly used with Outlet
interface DashboardLayoutProps {}

const DashboardLayout = ({}: DashboardLayoutProps) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-light-gray">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-6">
            <div className="flex flex-col space-y-3">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-96 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <div className="h-[120px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-[120px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-[120px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-[120px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-light-gray">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-6 pb-16"> {/* Added pb-16 to prevent content from being hidden by fixed bottom nav */}
          <Outlet /> {/* Render nested routes here */}
        </main>
        <Footer />
        <MobileBottomNav /> {/* Render mobile bottom nav here */}
      </div>
    </div>
  );
};

export default DashboardLayout;