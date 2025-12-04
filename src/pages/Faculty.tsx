"use client";

import React, { useState, useEffect, useMemo } from "react";
import FacultyTable from "@/components/FacultyTable";
import AddFacultyForm from "@/components/AddFacultyForm";
import { showSuccess, showError } from "@/utils/toast";
import EditDialog from "@/components/EditDialog"; // Changed from AddDialog
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { Faculty as FacultyDetails } from "@/components/FacultyTable";

export interface FacultyListItem {
  profile_id: string;
  email: string;
  role: "admin" | "faculty" | "staff" | "student";
  profile_avatar_url?: string;
  faculty_details_id?: string;
  name?: string;
  branch?: string;
  phone?: string;
  status?: "active" | "on-leave" | "retired";
  faculty_avatar_url?: string;
}

const FacultyPage = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";

  const [combinedFacultyList, setCombinedFacultyList] = useState<FacultyListItem[]>([]);
  const [loading, setLoading] = useState(true); // Corrected: useState(true)
  const [error, setError] = useState<string | null>(null);
  // Removed isAddFormOpen state
  // Removed isEditFormOpen state
  // Removed editingFacultyItem state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | FacultyDetails['status']>("all");

  const fetchFaculty = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, avatar_url')
        .eq('role', 'faculty');

      if (profilesError) throw profilesError;

      const { data: facultyDetailsData, error: facultyDetailsError } = await supabase
        .from('faculty')
        .select('*');

      if (facultyDetailsError) throw facultyDetailsError;

      const facultyDetailsMap = new Map<string, FacultyDetails>();
      facultyDetailsData.forEach(detail => {
        if (detail.user_id) {
          facultyDetailsMap.set(detail.user_id, { ...detail, branch: (detail as any).branch } as FacultyDetails);
        }
      });

      const combinedList: FacultyListItem[] = profilesData.map(profile => {
        const details = facultyDetailsMap.get(profile.id);
        return {
          profile_id: profile.id,
          email: profile.email,
          role: profile.role as "admin" | "faculty" | "staff" | "student",
          profile_avatar_url: profile.avatar_url || undefined,
          faculty_details_id: details?.id,
          name: details?.name,
          branch: details?.branch,
          phone: details?.phone,
          status: details?.status,
          faculty_avatar_url: details?.avatar_url,
        };
      });

      setCombinedFacultyList(combinedList);
    } catch (err: any) {
      console.error("Error fetching faculty data:", err);
      setError("Failed to load faculty members.");
      showError("Failed to load faculty members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // Removed handleAddFacultyDetails
  // Removed handleUpdateFacultyDetails
  // Removed handleEditFacultyItem

  // Removed handleDeleteFaculty function

  const filteredFaculty = useMemo(() => {
    return combinedFacultyList.filter(item => {
      const searchTarget = `${item.name || item.email} ${item.branch || ''} ${item.phone || ''} ${item.email}`.toLowerCase();
      const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [combinedFacultyList, searchTerm, filterStatus]);

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Faculty</h1>
        {/* Removed AddDialog for AddFacultyForm */}
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Manage and view faculty information at DIET KOLASIB.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6 px-4 sm:px-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, branch, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value: "all" | FacultyDetails['status']) => setFilterStatus(value)} defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4 px-4 sm:px-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 text-lg px-4 sm:px-6">{error}</div>
      ) : (
        <div className="px-4 sm:px-6">
          <FacultyTable
            faculty={filteredFaculty}
            // Removed onDelete prop
          />
        </div>
      )}

      {/* Removed Edit Dialog for both editing and adding details */}
    </div>
  );
};

export default FacultyPage;