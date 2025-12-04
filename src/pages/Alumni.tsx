"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus } from "lucide-react";
import AddDialog from "@/components/AddDialog";
import EditDialog from "@/components/EditDialog";
import AlumniTable from "@/components/AlumniTable"; // New component
import AddAlumniForm from "@/components/AddAlumniForm"; // New component
import EditAlumniForm from "@/components/EditAlumniForm"; // New component
import { useAuth } from "@/context/AuthContext";

export interface Alumni {
  id: string;
  name: string;
  email: string;
  graduation_year: number;
  course: string;
  contact_number?: string;
  current_occupation?: string;
  linked_in?: string;
  avatar_url?: string; // New field for profile picture URL
  cloudinary_public_id?: string; // New field for Cloudinary public ID
}

const AlumniPage = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";

  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGraduationYear, setFilterGraduationYear] = useState<"all" | string>("all");

  const fetchAlumni = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('alumni').select('*').order('graduation_year', { ascending: false });

    if (error) {
      console.error("Error fetching alumni:", error);
      setError("Failed to load alumni records.");
      showError("Failed to load alumni records.");
    } else {
      setAlumni(data as Alumni[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  const handleAddAlumni = async (newAlumniData: Omit<Alumni, 'id' | 'avatar_url' | 'cloudinary_public_id'>) => {
    if (!isAdminOrStaff) {
      showError("You do not have permission to add alumni.");
      return;
    }
    const { data, error } = await supabase.from('alumni').insert([newAlumniData]).select();

    if (error) {
      console.error("Error adding alumni:", error);
      showError("Failed to add alumni record.");
    } else if (data && data.length > 0) {
      setAlumni((prevAlumni) => [...prevAlumni, data[0] as Alumni]);
      showSuccess("Alumni record added successfully!");
      setIsAddFormOpen(false);
    }
  };

  const handleEditAlumni = (alumniMember: Alumni) => {
    if (!isAdminOrStaff) {
      showError("You do not have permission to edit alumni.");
      return;
    }
    setEditingAlumni(alumniMember);
    setIsEditFormOpen(true);
  };

  const handleUpdateAlumni = async (updatedAlumni: Alumni) => {
    if (!isAdminOrStaff) {
      showError("You do not have permission to update alumni.");
      return;
    }
    const { data, error } = await supabase.from('alumni').update(updatedAlumni).eq('id', updatedAlumni.id).select();

    if (error) {
      console.error("Error updating alumni:", error);
      showError("Failed to update alumni record.");
    } else if (data && data.length > 0) {
      setAlumni((prevAlumni) =>
        prevAlumni.map((a) => (a.id === updatedAlumni.id ? data[0] as Alumni : a))
      );
      showSuccess("Alumni record updated successfully!");
      setIsEditFormOpen(false);
      setEditingAlumni(null);
    }
  };

  const handleDeleteAlumni = async (id: string) => {
    if (!isAdminOrStaff) {
      showError("You do not have permission to delete alumni.");
      return;
    }

    // First, fetch the alumni record to get the cloudinary_public_id if it exists
    const { data: alumniToDelete, error: fetchError } = await supabase
      .from('alumni')
      .select('cloudinary_public_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error("Error fetching alumni for deletion:", fetchError);
      showError("Failed to fetch alumni record for deletion.");
      return;
    }

    // If there's a public_id, attempt to delete the image from Cloudinary
    if (alumniToDelete?.cloudinary_public_id) {
      try {
        const { data, error: cloudinaryError } = await supabase.functions.invoke("manage-cloudinary-image", {
          body: {
            action: "delete",
            userId: id, // Use alumni ID as userId for the edge function
            publicId: alumniToDelete.cloudinary_public_id,
          },
        });

        if (cloudinaryError) {
          console.error("Error invoking Cloudinary delete function:", cloudinaryError);
          showError(`Failed to delete image from Cloudinary: ${cloudinaryError.message}`);
          // Continue with database deletion even if image deletion fails
        } else if (data && data.success) {
          showSuccess("Alumni profile picture deleted from Cloudinary.");
        } else {
          console.warn("Cloudinary image deletion failed or returned unexpected response:", data);
          // Continue with database deletion
        }
      } catch (err: any) {
        console.error("Network error during Cloudinary image deletion:", err);
        showError(`Network error during image deletion: ${err.message}`);
        // Continue with database deletion
      }
    }

    // Then, delete the alumni record from Supabase
    const { error } = await supabase.from('alumni').delete().eq('id', id);

    if (error) {
      console.error("Error deleting alumni:", error);
      showError("Failed to delete alumni record.");
    } else {
      setAlumni((prevAlumni) => prevAlumni.filter((a) => a.id !== id));
      showSuccess("Alumni record deleted successfully!");
    }
  };

  const availableGraduationYears = useMemo(() => {
    const years = new Set(alumni.map(a => a.graduation_year));
    return ["all", ...Array.from(years).sort((a, b) => b - a).map(String)];
  }, [alumni]);

  const filteredAlumni = useMemo(() => {
    return alumni.filter(alumniMember => {
      const matchesSearch = alumniMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            alumniMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            alumniMember.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (alumniMember.current_occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesYear = filterGraduationYear === "all" || alumniMember.graduation_year.toString() === filterGraduationYear;
      return matchesSearch && matchesYear;
    });
  }, [alumni, searchTerm, filterGraduationYear]);

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Alumni Management</h1>
        {isAdminOrStaff && (
          <AddDialog
            title="Add New Alumni"
            triggerButtonText="Add New Alumni"
            isOpen={isAddFormOpen}
            onOpenChange={setIsAddFormOpen}
          >
            <AddAlumniForm onSuccess={handleAddAlumni} />
          </AddDialog>
        )}
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Manage and connect with former students of DIET KOLASIB.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6 px-4 sm:px-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, course, or occupation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value: "all" | string) => setFilterGraduationYear(value)} defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by year" />
          </SelectTrigger>
          <SelectContent>
            {availableGraduationYears.map(year => (
              <SelectItem key={year} value={year}>
                {year === "all" ? "All Years" : `Graduation Year ${year}`}
              </SelectItem>
            ))}
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
          <AlumniTable
            alumni={filteredAlumni}
            onEdit={handleEditAlumni}
            onDelete={handleDeleteAlumni}
          />
        </div>
      )}

      {editingAlumni && (
        <EditDialog
          title="Edit Alumni Record"
          isOpen={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
        >
          <EditAlumniForm alumni={editingAlumni} onSuccess={handleUpdateAlumni} />
        </EditDialog>
      )}
    </div>
  );
};

export default AlumniPage;