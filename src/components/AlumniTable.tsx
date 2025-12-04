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
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Mail, Phone, User as UserIcon, Eye } from "lucide-react"; // Added Eye icon
import { Alumni } from "@/pages/Alumni";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom"; // Import Link

interface AlumniTableProps {
  alumni: Alumni[];
  onEdit: (alumni: Alumni) => void;
  onDelete: (id: string) => void;
}

const AlumniTable = ({ alumni, onEdit, onDelete }: AlumniTableProps) => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";

  return (
    <div className="rounded-md border bg-white p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Graduation Year</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Occupation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alumni.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No alumni records found.
              </TableCell>
            </TableRow>
          ) : (
            alumni.map((alumniMember) => (
              <TableRow key={alumniMember.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={alumniMember.avatar_url || undefined} alt={alumniMember.name} />
                    <AvatarFallback>
                      {alumniMember.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{alumniMember.name}</TableCell>
                <TableCell>
                  <a href={`mailto:${alumniMember.email}`} className="text-blue-600 hover:underline flex items-center">
                    <Mail className="h-4 w-4 mr-1" /> {alumniMember.email}
                  </a>
                </TableCell>
                <TableCell>{alumniMember.graduation_year}</TableCell>
                <TableCell>{alumniMember.course}</TableCell>
                <TableCell>{alumniMember.current_occupation || "N/A"}</TableCell>
                <TableCell className="text-right flex items-center justify-end space-x-2">
                  {alumniMember.contact_number && (
                    <a href={`tel:${alumniMember.contact_number}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                        <Phone className="h-4 w-4" />
                        <span className="sr-only">Call</span>
                      </Button>
                    </a>
                  )}
                  <Link to={`/alumni/${alumniMember.id}`}>
                    <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </Link>
                  {isAdminOrStaff && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(alumniMember)}
                        className="p-2 h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="p-2 h-8 w-8"
                          >
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
                              This action cannot be undone. This will permanently delete the alumni record for "{alumniMember.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(alumniMember.id)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AlumniTable;