"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, UserCog, Edit, Phone, MapPin, Briefcase, Tag, BookOpen, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditProfileDialog from "@/components/EditProfileDialog";
import EditProfileForm from "@/components/EditProfileForm";
import { Badge } from "@/components/ui/badge";
import { formatStatus } from "@/lib/utils";

const Profile = () => {
  const { user, loading, refreshUser } = useAuth();
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);

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

  if (!user) {
    return (
      <div className="px-0 py-6 text-center text-red-500 text-lg">
        You must be logged in to view your profile.
      </div>
    );
  }

  const displayName = user.name || user.email; // Use user.name or fallback to email

  return (
    <div className="px-0 py-6 flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-md mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">My Profile</h1>
        <Button variant="outline" onClick={() => setIsEditProfileDialogOpen(true)} className="text-deep-blue hover:bg-deep-blue/10">
          <Edit className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>
      <p className="text-lg text-gray-700 mb-6 text-center max-w-2xl px-4">
        View and manage your personal account information.
      </p>

      <Card className="w-full max-w-md rounded-none sm:rounded-lg">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-deep-blue text-center">User Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-24 w-24 border-2 border-deep-blue mb-4">
              <AvatarImage src={user.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-gray-200 text-gray-500 text-3xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xl font-semibold">{displayName}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-base font-semibold">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-base font-semibold">{user.role || "student"}</p>
              </div>
            </div>

            {user.role === "student" && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-2 text-deep-blue">Student Information</h3>
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Roll No.</p>
                    <p className="text-base font-semibold">{user.rollno || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Semester</p>
                    <p className="text-base font-semibold">{user.year || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Course</p>
                    <p className="text-base font-semibold">{user.course || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone Number</p>
                    <p className="text-base font-semibold">{user.phone_number || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Address</p>
                    <p className="text-base font-semibold">{user.address || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={
                      user.status === "active"
                        ? "default"
                        : user.status === "passed-out"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {formatStatus(user.status || "N/A")}
                  </Badge>
                </div>
              </>
            )}

            {user.role === "faculty" && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-2 text-deep-blue">Faculty Information</h3>
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Branch</p>
                    <p className="text-base font-semibold">{user.branch || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Abbreviation</p>
                    <p className="text-base font-semibold">{user.abbreviation || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone Number</p>
                    <p className="text-base font-semibold">{user.phone || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={
                      user.status === "active"
                        ? "default"
                        : user.status === "on-leave"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {formatStatus(user.status || "N/A")}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <EditProfileDialog
        title="Edit Your Profile"
        isOpen={isEditProfileDialogOpen}
        onOpenChange={setIsEditProfileDialogOpen}
      >
        <EditProfileForm onSuccess={() => {
          setIsEditProfileDialogOpen(false);
          refreshUser(); // Ensure the AuthContext user is refreshed after edit
        }} />
      </EditProfileDialog>
    </div>
  );
};

export default Profile;