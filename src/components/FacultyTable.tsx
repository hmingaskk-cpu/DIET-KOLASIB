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
import { Edit, Trash2, Eye, PlusCircle } from "lucide-react";
import { formatStatus } from "@/lib/utils";
import { Link } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FacultyListItem } from "@/pages/Faculty";
import { showError } from "@/utils/toast"; // Import showError

export interface Faculty {
  id: string;
  user_id: string;
  name: string;
  branch: string;
  email: string;
  phone?: string;
  status: "active" | "on-leave" | "retired";
  avatar_url?: string;
  abbreviation?: string; // Added abbreviation field
}

interface FacultyTableProps {
  faculty: FacultyListItem[];
  // Removed onDelete prop
}

const FacultyTable = ({ faculty }: FacultyTableProps) => {
  return (
    <div className="rounded-md border bg-white p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Abbr.</TableHead> {/* New column for abbreviation */}
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            {/* Removed Details Status column */}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {faculty.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No faculty members found.
              </TableCell>
            </TableRow>
          ) : (
            faculty.map((facultyItem) => {
              const hasDetails = !!facultyItem.faculty_details_id;
              const isPhoneAnEmail = facultyItem.phone && facultyItem.phone.includes('@');
              
              return (
                <TableRow key={facultyItem.profile_id}>
                  <TableCell className="font-medium">{facultyItem.name || "N/A"}</TableCell>
                  <TableCell>{facultyItem.email}</TableCell>
                  <TableCell>{facultyItem.branch || "N/A"}</TableCell>
                  <TableCell>{facultyItem.abbreviation || "N/A"}</TableCell> {/* Display abbreviation */}
                  <TableCell>{isPhoneAnEmail ? "N/A" : facultyItem.phone || "N/A"}</TableCell>
                  <TableCell>
                    {facultyItem.status ? (
                      <Badge
                        variant={
                          facultyItem.status === "active"
                            ? "default"
                            : facultyItem.status === "on-leave"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {formatStatus(facultyItem.status)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </TableCell>
                  {/* Removed Details Status cell */}
                  <TableCell className="text-right flex items-center justify-end space-x-2">
                    {/* View Details Button - Always rendered but conditionally disabled */}
                    <Link to={`/faculty/${facultyItem.faculty_details_id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={!hasDetails}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </Link>
                    
                    {/* Removed Edit/Add Details Button */}
                    
                    {/* Removed Delete Button with AlertDialog */}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default FacultyTable;