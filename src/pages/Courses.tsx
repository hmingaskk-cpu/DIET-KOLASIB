"use client";

import React, { useState, useEffect, useMemo } from "react";
import CourseTable, { Course } from "@/components/CourseTable";
import AddCourseForm from "@/components/AddCourseForm";
import EditCourseForm from "@/components/EditCourseForm";
import { showSuccess, showError } from "@/utils/toast";
import AddDialog from "@/components/AddDialog";
import EditDialog from "@/components/EditDialog";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; // Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Search } from "lucide-react"; // Import Search icon

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // New state for search term
  const [filterStatus, setFilterStatus] = useState<"all" | Course['status']>("all"); // New state for filter status

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('courses').select('*');

    if (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses.");
      showError("Failed to load courses.");
    } else {
      setCourses(data as Course[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddCourse = async (newCourseData: Omit<Course, 'id'>) => {
    const { data, error } = await supabase.from('courses').insert([newCourseData]).select();

    if (error) {
      console.error("Error adding course:", error);
      showError("Failed to add course.");
    } else if (data && data.length > 0) {
      setCourses((prevCourses) => [...prevCourses, data[0] as Course]);
      showSuccess("Course added successfully!");
      setIsAddFormOpen(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsEditFormOpen(true);
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    const { data, error } = await supabase.from('courses').update(updatedCourse).eq('id', updatedCourse.id).select();

    if (error) {
      console.error("Error updating course:", error);
      showError("Failed to update course.");
    } else if (data && data.length > 0) {
      setCourses((prevCourses) =>
        prevCourses.map((c) => (c.id === updatedCourse.id ? data[0] as Course : c))
      );
      showSuccess("Course updated successfully!");
      setIsEditFormOpen(false);
      setEditingCourse(null);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);

    if (error) {
      console.error("Error deleting course:", error);
      showError("Failed to delete course.");
    } else {
      setCourses((prevCourses) => prevCourses.filter((c) => c.id !== id));
      showSuccess("Course deleted successfully!");
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || course.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, filterStatus]);

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Courses</h1>
        <AddDialog
          title="Add New Course"
          triggerButtonText="Add New Course"
          isOpen={isAddFormOpen}
          onOpenChange={setIsAddFormOpen}
        >
          <AddCourseForm onSuccess={handleAddCourse} />
        </AddDialog>
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Manage and view available courses at DIET KOLASIB.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6 px-4 sm:px-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, code, or instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value: "all" | Course['status']) => setFilterStatus(value)} defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
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
          <CourseTable
            courses={filteredCourses}
            onEdit={handleEditCourse}
            onDelete={handleDeleteCourse}
          />
        </div>
      )}

      {editingCourse && (
        <EditDialog
          title="Edit Course"
          isOpen={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
        >
          <EditCourseForm course={editingCourse} onSuccess={handleUpdateCourse} />
        </EditDialog>
      )}
    </div>
  );
};

export default Courses;