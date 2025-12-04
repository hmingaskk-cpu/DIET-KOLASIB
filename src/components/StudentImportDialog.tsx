"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Import DialogDescription
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import * as z from "zod";
import { Student } from "./StudentTable"; // Re-use Student interface

// Schema for validating each row from the CSV
const importStudentSchema = z.object({
  name: z.string().min(2, { message: "Name is required." }),
  email: z.string().email({ message: "Valid email is required." }),
  rollno: z.string().min(1, { message: "Roll No. is required and must be at least 1 character." }), // Changed min length to 1
  // Removed 'course' from schema
  year: z.coerce.number().min(1).max(4, { message: "Semester must be between 1 and 4." }),
  status: z.enum(["active", "passed-out", "on-leave"], { message: "Invalid status." }),
});

interface StudentImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

const StudentImportDialog = ({ isOpen, onOpenChange, onImportSuccess }: StudentImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleImport = () => {
    if (!file) {
      showError("Please select a CSV file to import.");
      return;
    }

    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const studentsToInsert: Omit<Student, 'id' | 'avatar_url'>[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index) => {
          const rowNumber = index + 2; // +1 for 0-indexed, +1 for header row
          try {
            // Ensure column names match schema keys (case-insensitive handling if needed)
            const validatedRow = importStudentSchema.parse({
              name: row.name?.trim(), // Trim whitespace
              email: row.email?.trim(),
              rollno: row.rollno?.trim(), // Trim whitespace, changed to 'rollno'
              // Removed 'course' from parsing
              year: row.year,
              status: row.status,
            });
            // Add the implicit course value
            studentsToInsert.push({...validatedRow, course: "D.El.Ed"}); // Hardcode the single course value
          } catch (e: any) {
            if (e instanceof z.ZodError) {
              e.errors.forEach(err => {
                errors.push(`Row ${rowNumber} - ${err.path.join('.')}: ${err.message}`);
              });
            } else {
              errors.push(`Row ${rowNumber} - Unknown error: ${e.message}`);
            }
          }
        });

        if (errors.length > 0) {
          const displayErrors = errors.slice(0, 3).join('\n'); // Show first 3 errors
          const moreErrors = errors.length > 3 ? `\n...and ${errors.length - 3} more.` : '';
          showError(`Import failed: ${displayErrors}${moreErrors}\nCheck console for full details.`);
          console.error("CSV Import Errors:", errors);
          setIsProcessing(false);
          return;
        }

        if (studentsToInsert.length === 0) {
          showError("No valid student data found in the CSV file.");
          setIsProcessing(false);
          return;
        }

        // Batch insert into Supabase
        const { error: insertError } = await supabase.from('students').insert(studentsToInsert);

        if (insertError) {
          console.error("Supabase insert error:", insertError);
          showError(`Failed to import students: ${insertError.message}`);
        } else {
          showSuccess(`${studentsToInsert.length} students imported successfully!`);
          onImportSuccess();
          onOpenChange(false); // Close dialog
        }
        setIsProcessing(false);
        setFile(null); // Clear selected file
      },
      error: (err) => {
        console.error("CSV parsing error:", err);
        showError(`Failed to parse CSV: ${err.message}`);
        setIsProcessing(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple student records.
            Ensure your CSV has the following exact column headers: `name`, `email`, `rollno`, `year`, `status`.
            The course will be automatically set to "D.El.Ed".
            <br />
            Example values for `status`: `active`, `passed-out`, `on-leave`.
            <br />
            Example values for `year`: `1`, `2`, `3`, `4`.
            <br />
            Example `rollno` format: `321/2024`.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="csv-file" className="sr-only">
              CSV File
            </Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>
        </div>
        <Button
          onClick={handleImport}
          disabled={!file || isProcessing}
          className="w-full bg-app-green text-white hover:bg-app-green/90"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {isProcessing ? "Importing..." : "Import Students"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default StudentImportDialog;