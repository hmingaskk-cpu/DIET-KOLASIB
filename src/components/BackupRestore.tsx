"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Upload, Loader2, AlertCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label"; // Import Label for the file input

interface BackupRestoreProps {}

const BackupRestore = ({}: BackupRestoreProps) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const tables = ['students', 'courses', 'faculty', 'calendarEvents'];
      const backupData: { [key: string]: any[] } = {};

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
          throw new Error(`Failed to fetch data from ${table}: ${error.message}`);
        }
        backupData[table] = data || [];
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diet_kolasib_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess("Data backup successful!");
    } catch (error: any) {
      console.error("Backup failed:", error);
      showError(`Backup failed: ${error.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const restoreData = JSON.parse(content);

          // Define the order of tables for restoration to handle foreign key constraints if any
          // For simplicity, assuming no strict FK constraints that prevent deletion/insertion in any order
          const tables = ['students', 'courses', 'faculty', 'calendarEvents'];

          for (const table of tables) {
            if (restoreData[table]) {
              // Clear existing data
              const { error: deleteError } = await supabase.from(table).delete().neq('id', '0'); // Delete all rows
              if (deleteError) {
                throw new Error(`Failed to clear existing data in ${table}: ${deleteError.message}`);
              }

              // Insert new data
              if (restoreData[table].length > 0) {
                const { error: insertError } = await supabase.from(table).insert(restoreData[table]);
                if (insertError) {
                  throw new Error(`Failed to insert data into ${table}: ${insertError.message}`);
                }
              }
            }
          }
          showSuccess("Data restoration successful!");
        } catch (parseError: any) {
          console.error("Restore failed (parsing/db ops):", parseError);
          showError(`Data restoration failed: ${parseError.message}`);
        } finally {
          setIsRestoring(false);
          // Clear the file input
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    } catch (error: any) {
      console.error("Restore failed (file read):", error);
      showError(`Data restoration failed: ${error.message}`);
      setIsRestoring(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-deep-blue">Data Backup & Restore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Backup your application data to a JSON file or restore from a previously saved file.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleBackup}
            disabled={isBackingUp || isRestoring}
            className="w-full sm:w-auto bg-app-green text-white hover:bg-app-green/90"
          >
            {isBackingUp ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Backup Data
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isBackingUp || isRestoring}
                className="w-full sm:w-auto border-app-green text-app-green hover:bg-app-green/10"
                // Removed asChild from here
              >
                {/* Wrap children in a single span */}
                <span>
                  {isRestoring ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Restore Data
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center">
                  <AlertCircle className="mr-2 h-6 w-6" /> Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Restoring data will **permanently delete all existing data** in your application and replace it with the data from your backup file. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Label htmlFor="restore-file-input" className="cursor-pointer bg-destructive text-white hover:bg-destructive/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2">
                    <Input
                      id="restore-file-input"
                      type="file"
                      accept=".json"
                      onChange={handleRestore}
                      className="hidden"
                      disabled={isBackingUp || isRestoring}
                    />
                    Confirm Restore
                  </Label>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {(isBackingUp || isRestoring) && (
          <p className="text-sm text-muted-foreground mt-2">
            {isBackingUp ? "Preparing backup..." : "Processing restore..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupRestore;