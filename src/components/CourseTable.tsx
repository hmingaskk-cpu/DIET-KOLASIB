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
import { Button } from "@/components/ui/button"; // Import Button
import { Edit, Trash2 } from "lucide-react"; // Import Edit and Trash2 icons
import { formatStatus } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Import AlertDialog

export interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
  credits: number;
  status: "active" | "inactive" | "upcoming";
}

interface CourseTableProps {
  courses: Course[];
  onEdit: (course: Course) => void; // New prop for edit action
  onDelete: (id: string) => void; // New prop for delete action
}

const CourseTable = ({ courses, onEdit, onDelete }: CourseTableProps) => {
  return (
    <div className="rounded-md border bg-white p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course Code</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead> {/* New column for actions */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">{course.code}</TableCell>
              <TableCell>{course.title}</TableCell>
              <TableCell>{course.instructor}</TableCell>
              <TableCell>{course.credits}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    course.status === "active"
                      ? "default"
                      : course.status === "upcoming"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {formatStatus(course.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(course)} // Call onEdit with course data
                  className="mr-2"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      // Removed asChild from here
                    >
                      {/* Wrap icon and text in a single span */}
                      <span>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the course "{course.title}" from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(course.id)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourseTable;