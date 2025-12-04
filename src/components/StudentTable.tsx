"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Eye } from "lucide-react";
import { formatStatus } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
// Removed Pagination imports
import { StudentListItem } from "@/pages/Students";

// Define the Student interface for detailed records (used by StudentDetail, AttendanceForm)
export interface Student {
  id: string;
  user_id?: string; // Optional: Link to auth.users.id
  name: string;
  email: string;
  rollno: string;
  course: string; // Keep course here as it's still in the DB, just not selectable in UI
  year: number; // Represents semester
  status: "active" | "passed-out" | "on-leave";
  avatar_url?: string;
  created_at?: string;
  phone_number?: string; // New field
  address?: string;      // New field
}

interface StudentTableProps {
  students: StudentListItem[];
  // Removed onEdit, onDelete, selectedStudents, onSelectStudent, onSelectAllStudents props
}

const StudentTable = ({
  students,
  // Removed onEdit, onDelete, selectedStudents, onSelectStudent, onSelectAllStudents from destructuring
}: StudentTableProps) => {
  // Removed allSelected, indeterminate, totalPages calculations

  return (
    <div className="rounded-md border bg-white p-4">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Removed Checkbox TableHead */}
            <TableHead>Roll No.</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            {/* Removed Course column */}
            <TableHead>Semester</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Profile Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No student records found.
              </TableCell>
            </TableRow>
          ) : (
            students.map((studentItem) => (
              <TableRow key={studentItem.student_details_id}>
                {/* Removed Checkbox TableCell */}
                <TableCell className="font-medium">{studentItem.rollno || "N/A"}</TableCell>
                <TableCell>{studentItem.name || "N/A"}</TableCell>
                <TableCell>{studentItem.email || "N/A"}</TableCell>
                {/* Removed Course cell */}
                <TableCell>{studentItem.semester || "N/A"}</TableCell>
                <TableCell>
                  {studentItem.status ? (
                    <Badge
                      variant={
                        studentItem.status === "active"
                          ? "default"
                          : studentItem.status === "passed-out"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {formatStatus(studentItem.status)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {studentItem.profile_id ? (
                    <Badge className="bg-app-green text-white">Linked</Badge>
                  ) : (
                    <Badge variant="destructive">Missing</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right flex items-center justify-end space-x-2">
                  <Link to={`/students/${studentItem.student_details_id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </Link>
                  {/* Removed Edit Button */}
                  {/* Removed Delete Button with AlertDialog */}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Removed Pagination component */}
    </div>
  );
};

export default StudentTable;