"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Download, UploadCloud, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import AddDialog from "@/components/AddDialog";
import EditDialog from "@/components/EditDialog";
import AddResourceForm, { Resource } from "@/components/AddResourceForm";
import EditResourceForm from "@/components/EditResourceForm";
import { Skeleton } from "@/components/ui/skeleton";
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

const Resources = () => {
  const { user } = useAuth();
  const isAdminStaffFaculty = user?.role === "admin" || user?.role === "staff" || user?.role === "faculty";

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching resources:", error);
      setError("Failed to load resources.");
      showError("Failed to load resources.");
    } else {
      setResources(data as Resource[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAddResource = async (newResourceData: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('resources').insert([newResourceData]).select();

    if (error) {
      console.error("Error adding resource:", error);
      showError("Failed to add resource.");
    } else if (data && data.length > 0) {
      setResources((prevResources) => [...prevResources, data[0] as Resource]);
      showSuccess("Resource added successfully!");
      setIsAddFormOpen(false);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setIsEditFormOpen(true);
  };

  const handleUpdateResource = async (updatedResource: Resource) => {
    const { data, error } = await supabase.from('resources').update(updatedResource).eq('id', updatedResource.id).select();

    if (error) {
      console.error("Error updating resource:", error);
      showError("Failed to update resource.");
    } else if (data && data.length > 0) {
      setResources((prevResources) =>
        prevResources.map((r) => (r.id === updatedResource.id ? data[0] as Resource : r))
      );
      showSuccess("Resource updated successfully!");
      setIsEditFormOpen(false);
      setEditingResource(null);
    }
  };

  const handleDeleteResource = async (id: string, publicId: string, uploadedBy: string) => {
    // First, delete from Cloudinary
    try {
      const { data, error: cloudinaryError } = await supabase.functions.invoke("manage-cloudinary-image", {
        body: {
          action: "delete",
          userId: uploadedBy, // Pass the uploader's ID for permission check
          publicId: publicId,
        },
      });

      if (cloudinaryError) {
        console.error("Error invoking Cloudinary delete function for resource:", cloudinaryError);
        showError(`Failed to delete file from Cloudinary: ${cloudinaryError.message}`);
        // Continue with database deletion even if image deletion fails
      } else if (data && data.success) {
        showSuccess("Resource file deleted from Cloudinary.");
      } else {
        console.warn("Cloudinary file deletion failed or returned unexpected response:", data);
        // Continue with database deletion
      }
    } catch (err: any) {
      console.error("Network error during Cloudinary file deletion:", err);
      showError(`Network error during file deletion: ${err.message}`);
      // Continue with database deletion
    }

    // Then, delete from Supabase
    const { error } = await supabase.from('resources').delete().eq('id', id);

    if (error) {
      console.error("Error deleting resource:", error);
      showError("Failed to delete resource.");
    } else {
      setResources((prevResources) => prevResources.filter((r) => r.id !== id));
      showSuccess("Resource deleted successfully!");
    }
  };

  const handleDownload = (fileUrl: string) => {
    console.log("Attempting to download/open file from URL:", fileUrl); // Added console log
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Resources</h1>
        {isAdminStaffFaculty && (
          <AddDialog
            title="Upload New Resource"
            triggerButtonText="Upload Resource"
            isOpen={isAddFormOpen}
            onOpenChange={setIsAddFormOpen}
          >
            <AddResourceForm onSuccess={handleAddResource} />
          </AddDialog>
        )}
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Access important documents, study materials, and institutional resources.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 sm:px-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-none sm:rounded-lg" />
          ))
        ) : error ? (
          <div className="text-center text-red-500 text-lg col-span-full">{error}</div>
        ) : resources.length === 0 ? (
          <p className="text-gray-600 col-span-full">No resources available at the moment.</p>
        ) : (
          resources.map(resource => (
            <Card key={resource.id} className="rounded-none sm:rounded-lg flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-lg font-semibold text-deep-blue">{resource.title}</CardTitle>
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow px-4 sm:px-6">
                <p className="text-sm text-gray-700 mb-4">{resource.description || "No description provided."}</p>
                <div className="flex items-center justify-between mt-auto">
                  <Button
                    variant="outline"
                    className="bg-app-green text-white hover:bg-app-green/90 flex-1 mr-2"
                    onClick={() => handleDownload(resource.file_url)}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  {isAdminStaffFaculty && (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditResource(resource)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
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
                              This action cannot be undone. This will permanently delete the resource "{resource.title}" and its associated file.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteResource(resource.id, resource.cloudinary_public_id, resource.uploaded_by)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingResource && (
        <EditDialog
          title="Edit Resource"
          isOpen={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
        >
          <EditResourceForm resource={editingResource} onSuccess={handleUpdateResource} />
        </EditDialog>
      )}
    </div>
  );
};

export default Resources;