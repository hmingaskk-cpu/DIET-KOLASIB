"use client";

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Alumni } from "@/pages/Alumni"; // Import Alumni interface
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Phone, Briefcase, GraduationCap, Linkedin, MapPin, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageUpload from "@/components/ImageUpload"; // Import ImageUpload
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const AlumniDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth(); // Get authUser
  const isAdminOrStaff = authUser?.role === "admin" || authUser?.role === "staff";

  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlumni = async () => { // Define an async function here
      console.log("AlumniDetail: useEffect triggered. ID from useParams:", id);
      if (!id) {
        setError("Alumni ID is missing.");
        setLoading(false);
        console.log("AlumniDetail: ID is missing, setting error and loading to false.");
        return;
      }

      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("AlumniDetail: Error fetching alumni details:", error);
        setError("Failed to load alumni details.");
        showError("Failed to load alumni details.");
      } else if (data) {
        setAlumni(data as Alumni);
        console.log("AlumniDetail: Fetched alumni data:", data);
      } else {
        setError("Alumni member not found.");
        showError("Alumni member not found.");
        console.log("AlumniDetail: No data returned for ID:", id);
      }
      setLoading(false);
      console.log("AlumniDetail: Data fetching complete, loading set to false.");
    };

    fetchAlumni(); // Call the async function
  }, [id]);

  // These handlers are for the ImageUpload component if it were to allow editing directly on this page.
  // For now, editing is handled via EditAlumniForm.
  const handleUploadSuccess = async (imageUrl: string, publicId: string) => {
    // This function is not intended to be called from AlumniDetail for now.
    // It's here as a placeholder if direct editing is desired in the future.
    console.warn("ImageUpload on AlumniDetail page is for display only. Upload functionality is not implemented here.");
  };

  const handleRemoveSuccess = async () => {
    // This function is not intended to be called from AlumniDetail for now.
    // It's here as a placeholder if direct editing is desired in the future.
    console.warn("ImageUpload on AlumniDetail page is for display only. Remove functionality is not implemented here.");
  };

  const canEditAvatar = isAdminOrStaff; // Only admin/staff can edit alumni avatars

  if (loading) {
    console.log("AlumniDetail: Rendering loading state.");
    return (
      <div className="px-0 py-6 space-y-6">
        <Skeleton className="h-10 w-48 px-4" />
        <Skeleton className="h-8 w-full px-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    console.log("AlumniDetail: Rendering error state:", error);
    return (
      <div className="px-0 py-6 text-center text-red-500 text-lg">
        <p className="px-4">{error}</p>
        <Link to="/alumni" className="mt-4 inline-flex items-center text-app-green hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Alumni
        </Link>
      </div>
    );
  }

  if (!alumni) {
    console.log("AlumniDetail: Rendering 'no alumni data' state.");
    return (
      <div className="px-0 py-6 text-center text-gray-600 text-lg">
        <p className="px-4">No alumni data available.</p>
        <Link to="/alumni" className="mt-4 inline-flex items-center text-app-green hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Alumni
        </Link>
      </div>
    );
  }

  console.log("AlumniDetail: Rendering alumni details for:", alumni.name);
  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Alumni Details</h1>
        <Link to="/alumni">
          <Button variant="outline" className="text-deep-blue hover:bg-deep-blue/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Alumni
          </Button>
        </Link>
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Comprehensive information for {alumni.name}.
      </p>

      <Card className="w-full max-w-4xl mx-auto rounded-none sm:rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
          <CardTitle className="text-2xl font-semibold text-deep-blue">{alumni.name}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 px-4 sm:px-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-deep-blue flex items-center justify-center bg-gray-100 mb-4">
              {alumni.avatar_url ? (
                <img src={alumni.avatar_url} alt={alumni.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <User className="h-20 w-20 text-gray-400" />
              )}
            </div>
            {/* ImageUpload component for display only on this page */}
            <ImageUpload
              currentImageUrl={alumni.avatar_url}
              currentPublicId={alumni.cloudinary_public_id}
              onUploadSuccess={handleUploadSuccess} // Placeholder, not active for direct upload
              onRemoveSuccess={handleRemoveSuccess}   // Placeholder, not active for direct remove
              userId={alumni.id} // Use alumni ID for folder path
              label="Alumni Profile Picture"
              className="w-full max-w-sm"
              canEdit={canEditAvatar} // Pass the canEdit prop
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Graduation Year</p>
                <p className="text-base font-semibold">{alumni.graduation_year}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Course</p>
                <p className="text-base font-semibold">{alumni.course}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-base font-semibold">{alumni.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Contact Number</p>
                <p className="text-base font-semibold">{alumni.contact_number || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 col-span-full">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-600">Current Occupation</p>
                <p className="text-base font-semibold">{alumni.current_occupation || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 col-span-full">
              <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-600">Address</p>
                <p className="text-base font-semibold">{alumni.address || "N/A"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlumniDetail;