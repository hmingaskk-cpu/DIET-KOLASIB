"use client";

import React, { useState, useEffect, useMemo } from "react";
import StudentTable from "@/components/StudentTable";
import StudentImportDialog from "@/components/StudentImportDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Download, Upload } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { exportToCsv } from "@/utils/export";

// Define a new interface for the combined data displayed in the table
export interface StudentListItem {
  student_details_id: string; // ID from the 'students' table (always present)
  name: string;
  rollno: string;
  // Removed 'course' as it's no longer a selectable field
  semester: number;
  status: "active" | "passed-out" | "on-leave";
  student_avatar_url?: string;

  // Optional profile data
  profile_id?: string; // ID from 'profiles' table
  email?: string; // Email from 'profiles' table
  role?: "admin" | "faculty" | "staff" | "student"; // Role from 'profiles' table
  profile_avatar_url?: string; // Avatar from 'profiles' table
}

const Students = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";

  const [combinedStudentList, setCombinedStudentList] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportFormOpen, setIsImportFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "passed-out" | "on-leave">("all");
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<string>("all");
  // Removed selectedStudents state

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all student details from the 'students' table
      let studentDetailsQuery = supabase
        .from('students')
        .select('*'); // Removed count and range for displaying all students

      // Apply filters to student details
      if (searchTerm) {
        studentDetailsQuery = studentDetailsQuery.or(`name.ilike.%${searchTerm}%,rollno.ilike.%${searchTerm}%`);
      }
      if (filterStatus !== "all") {
        studentDetailsQuery = studentDetailsQuery.eq('status', filterStatus);
      }
      if (selectedSemesterTab !== "all") {
        studentDetailsQuery = studentDetailsQuery.eq('year', parseInt(selectedSemesterTab));
      }

      const { data: studentDetailsData, error: studentDetailsError } = await studentDetailsQuery
        .order('name', { ascending: true });

      if (studentDetailsError) throw studentDetailsError;

      // 2. Collect all user_ids from fetched student details
      const userIds = studentDetailsData?.map(s => s.user_id).filter(Boolean) as string[];

      // 3. Fetch corresponding profiles for these user_ids
      let profilesMap = new Map<string, { email: string; role: string; avatar_url?: string }>();
      if (userIds && userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, role, avatar_url')
          .in('id', userIds);
        if (profilesError) throw profilesError;

        profilesData?.forEach(p => profilesMap.set(p.id, p));
      }

      // 4. Combine student details with profile data
      const combinedList: StudentListItem[] = (studentDetailsData || []).map(student => {
        const profile = student.user_id ? profilesMap.get(student.user_id) : undefined;
        return {
          student_details_id: student.id,
          name: student.name,
          rollno: student.rollno,
          // Removed 'course' from here
          semester: student.year,
          status: student.status,
          student_avatar_url: student.avatar_url || undefined,
          profile_id: profile?.id,
          email: profile?.email,
          role: profile?.role as "admin" | "faculty" | "staff" | "student",
          profile_avatar_url: profile?.avatar_url || undefined,
        };
      });

      setCombinedStudentList(combinedList);

    } catch (err: any) {
      console.error("Error fetching student data:", err);
      setError("Failed to load students.");
      showError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, filterStatus, selectedSemesterTab]);

  // Removed handleDeleteStudent function

  // Removed handleSelectStudent function

  // Removed handleSelectAllStudents function

  // Removed handleBulkDelete function

  const handleExportStudents = () => {
    const headers = [
      { key: 'rollno', label: 'Roll No.' },
      { key: 'name', label: 'Student Name' },
      { key: 'email', label: 'Email' },
      { key: 'semester', label: 'Semester' },
      { key: 'status', label: 'Status' },
    ];
    // Export all filtered students currently in combinedStudentList
    const studentsToExport = combinedStudentList.map(item => ({
      rollno: item.rollno || 'N/A',
      name: item.name || 'N/A',
      email: item.email || 'N/A',
      semester: item.semester || 'N/A',
      status: item.status || 'N/A',
    }));
    exportToCsv(studentsToExport, "students_data", headers);
    showSuccess("Student data exported successfully!");
  };

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Students</h1>
        <div className="flex space-x-4">
          {/* Removed Bulk Delete Button */}
          <Button onClick={handleExportStudents} className="bg-app-green text-white hover:bg-app-green/90">
            <Download className="mr-2 h-4 w-4" /> Export to CSV
          </Button>
          {isAdminOrStaff && (
            <>
              <Button onClick={() => setIsImportFormOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                <Upload className="mr-2 h-4 w-4" /> Import Students
              </Button>
            </>
          )}
        </div>
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Manage and view student information at DIET KOLASIB.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6 px-4 sm:px-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll no..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value: "all" | "active" | "passed-out" | "on-leave") => {
          setFilterStatus(value);
        }} defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="passed-out">Passed Out</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Semester Tabs */}
      <Tabs value={selectedSemesterTab} onValueChange={(value) => {
        setSelectedSemesterTab(value);
      }} className="mb-6 px-4 sm:px-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Semesters</TabsTrigger>
          <TabsTrigger value="1">1st Semester</TabsTrigger>
          <TabsTrigger value="2">2nd Semester</TabsTrigger>
          <TabsTrigger value="3">3rd Semester</TabsTrigger>
          <TabsTrigger value="4">4th Semester</TabsTrigger>
        </TabsList>
      </Tabs>

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
          <StudentTable
            students={combinedStudentList}
            // Removed onEdit, onDelete, selectedStudents, onSelectStudent, onSelectAllStudents props
          />
        </div>
      )}

      <StudentImportDialog
        isOpen={isImportFormOpen}
        onOpenChange={setIsImportFormOpen}
        onImportSuccess={fetchStudents} // Refresh student list after import
      />
    </div>
  );
};

export default Students;