"use client";

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Faculty } from "@/components/FacultyTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, BookOpen, Mail, Phone, Briefcase, UserSquare, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { formatStatus } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/ImageUpload"; // Import ImageUpload component
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const FacultyDetail = () => {
  const { id } = useParams<{ id: string }>(); // This 'id' is now faculty_details_id
  const { user: authUser, refreshUser } = useAuth(); // Get authUser and refreshUser
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null); // State for avatar from profiles
  const [profileCloudinaryPublicId, setProfileCloudinaryPublicId] = useState<string | null>(null); // State for public_id from profiles
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      if (!id) {
        setError("Faculty ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch faculty details
        const { data: facultyData, error: facultyError } = await supabase
          .from('faculty')
          .select('*')
          .eq('id', id) // Query by faculty_details_id
          .single();

        if (facultyError) {
          throw new Error(`Failed to load faculty details: ${facultyError.message}`);
        }
        setFaculty(facultyData as Faculty);

        // Fetch profile avatar if user_id exists
        if (facultyData?.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('avatar_url, cloudinary_public_id')
            .eq('id', facultyData.user_id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error("Error fetching faculty profile avatar:", profileError);
            // Don't throw, just log and continue without avatar
          } else if (profileData) {
            setProfileAvatarUrl(profileData.avatar_url || null);
            setProfileCloudinaryPublicId(profileData.cloudinary_public_id || null);
          }
        } else {
          setProfileAvatarUrl(null);
          setProfileCloudinaryPublicId(null);
        }

      } catch (err: any) {
        console.error("Error fetching faculty details:", err);
        setError(err.message || "Failed to load faculty details.");
        showError(err.message || "Failed to load faculty details.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [id]);

  const handleUploadSuccess = async (imageUrl: string, publicId: string) => {
    if (!faculty?.user_id) return; // Use faculty.user_id to link to auth.users.id

    const { error: updateError } = await supabase
      .from('profiles') // Update profiles table
      .update({ avatar_url: imageUrl, cloudinary_public_id: publicId }) // Update public_id too
      .eq('id', faculty.user_id); // Match by faculty.user_id

    if (updateError) {
      console.error("Error updating faculty avatar URL/public_id in DB:", updateError);
      showError("Failed to update avatar URL in database.");
    } else {
      // Update local faculty state for immediate visual feedback
      setFaculty((prev) => (prev ? { ...prev, avatar_url: imageUrl, cloudinary_public_id: publicId } : null));
      showSuccess("Profile picture updated successfully!");
      refreshUser(); // Refresh AuthContext user if this is the logged-in user
    }
  };

  const handleRemoveSuccess = async () => {
    if (!faculty?.user_id) return;

    const { error: updateError } = await supabase
      .from('profiles') // Update profiles table
      .update({ avatar_url: null, cloudinary_public_id: null }) // Clear public_id too
      .eq('id', faculty.user_id); // Match by faculty.user_id

    if (updateError) {
      console.error("Error removing faculty avatar URL/public_id from DB:", updateError);
      showError("Failed to remove avatar URL from database.");
    } else {
      // Update local faculty state for immediate visual feedback
      setFaculty((prev) => (prev ? { ...prev, avatar_url: null, cloudinary_public_id: null } : null));
      showSuccess("Profile picture removed successfully!");
      refreshUser(); // Refresh AuthContext user if this is the logged-in user
    }
  };

  const canEditAvatar = (authUser?.role === "admin" || authUser?.role === "staff") || (authUser?.id === faculty?.user_id);

  if (loading) {
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
    return (
      <div className="px-0 py-6 text-center text-red-500 text-lg">
        <p className="px-4">{error}</p>
        <Link to="/faculty" className="mt-4 inline-flex items-center text-app-green hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Faculty
        </Link>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="px-0 py-6 text-center text-gray-600 text-lg">
        <p className="px-4">No faculty data available.</p>
        <Link to="/faculty" className="mt-4 inline-flex items-center text-app-green hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Faculty
        </Link>
      </div>
    );
  }

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Faculty Details</h1>
        <Link to="/faculty">
          <Button variant="outline" className="text-deep-blue hover:bg-deep-blue/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Faculty
          </Button>
        </Link>
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Comprehensive information for {faculty.name}.
      </p>

      <Card className="w-full max-w-4xl mx-auto rounded-none sm:rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
          <CardTitle className="text-2xl font-semibold text-deep-blue">{faculty.name}</CardTitle>
          <Badge
            variant={
              faculty.status === "active"
                ? "default"
                : faculty.status === "on-leave"
                ? "secondary"
                : "destructive"
            }
            className="text-lg px-3 py-1"
          >
            {formatStatus(faculty.status)}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 px-4 sm:px-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-deep-blue flex items-center justify-center bg-gray-100 mb-4">
              {profileAvatarUrl ? (
                <img src={profileAvatarUrl} alt={`${faculty.name}'s avatar`} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <UserSquare className="h-20 w-20 text-gray-400" />
              )}
            </div>
            {faculty.user_id && ( // Only show ImageUpload if user_id is available
              <ImageUpload
                currentImageUrl={profileAvatarUrl}
                currentPublicId={profileCloudinaryPublicId} // Pass public_id
                onUploadSuccess={handleUploadSuccess}
                onRemoveSuccess={handleRemoveSuccess}
                userId={faculty.user_id} // Pass the Supabase auth.users.id
                label="Change Profile Picture"
                className="w-full max-w-sm"
                canEdit={canEditAvatar} // Pass the canEdit prop
              />
            )}
            {!faculty.user_id && (
              <p className="text-sm text-red-500 mt-2">
                Cannot upload avatar: Faculty profile is not linked to a user account.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Branch</p>
                <p className="text-base font-semibold">{faculty.branch}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-base font-semibold">{faculty.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Phone</p>
                <p className="text-base font-semibold">{faculty.phone || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-deep-blue mb-2">Teaching Assignments</h3>
            <p className="text-gray-700">
              This section will display the courses and classes assigned to {faculty.name}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyDetail;