"use client";

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Student } from "@/components/StudentTable"; // Assuming Student interface is still needed for fetching
import { AttendanceRecord } from "@/components/AttendanceForm"; // Import AttendanceRecord interface
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, CalendarDays, GraduationCap, Image as ImageIcon, CheckCircle, Mail, Phone, MapPin, ClipboardCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { formatStatus } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/ImageUpload";
import { useAuth } from "@/context/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>(); // This 'id' is now student_details_id
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth(); // Get authUser and refreshUser
  const isAdminOrStaff = authUser?.role === "admin" || authUser?.role === "staff";

  const [student, setStudent] = useState<Student | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null); // State for avatar from profiles
  const [profileCloudinaryPublicId, setProfileCloudinaryPublicId] = useState<string | null>(null); // State for public_id from profiles
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchStudentAndAttendance = async () => {
      if (!id) {
        setError("Student ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch student details
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', id) // Query by student_details_id
          .single();

        if (studentError) {
          throw new Error(`Failed to load student details: ${studentError.message}`);
        }
        setStudent(studentData as Student);

        // Fetch profile avatar if user_id exists
        if (studentData?.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('avatar_url, cloudinary_public_id')
            .eq('id', studentData.user_id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error("Error fetching student profile avatar:", profileError);
            // Don't throw, just log and continue without avatar
          } else if (profileData) {
            setProfileAvatarUrl(profileData.avatar_url || null);
            setProfileCloudinaryPublicId(profileData.cloudinary_public_id || null);
          }
        } else {
          setProfileAvatarUrl(null);
          setProfileCloudinaryPublicId(null);
        }

        // Fetch recent attendance records for this student
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', id)
          .order('date', { ascending: false })
          .order('period', { ascending: false })
          .limit(5); // Show last 5 attendance records

        if (attendanceError) {
          throw new Error(`Failed to load attendance records: ${attendanceError.message}`);
        }
        setRecentAttendance(attendanceData as AttendanceRecord[]);

      } catch (err: any) {
        console.error("Error fetching student details or attendance:", err);
        setError(err.message || "Failed to load student information.");
        showError(err.message || "Failed to load student information.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndAttendance();
  }, [id]);

  const handleUploadSuccess = async (imageUrl: string, publicId: string) => {
    if (!student?.user_id) return; // Use student.user_id to link to auth.users.id

    const { error: updateError } = await supabase
      .from('profiles') // Update profiles table
      .update({ avatar_url: imageUrl, cloudinary_public_id: publicId }) // Update public_id too
      .eq('id', student.user_id); // Match by student.user_id

    if (updateError) {
      console.error("Error updating student avatar URL/public_id in DB:", updateError);
      showError("Failed to update avatar URL in database.");
    } else {
      // Update local state for immediate visual feedback
      setProfileAvatarUrl(imageUrl);
      setProfileCloudinaryPublicId(publicId);
      showSuccess("Profile picture updated successfully!");
      refreshUser(); // Refresh AuthContext user if this is the logged-in user
    }
  };

  const handleRemoveSuccess = async () => {
    if (!student?.user_id) return;

    const { error: updateError } = await supabase
      .from('profiles') // Update profiles table
      .update({ avatar_url: null, cloudinary_public_id: null }) // Clear public_id too
      .eq('id', student.user_id); // Match by student.user_id

    if (updateError) {
      console.error("Error removing student avatar URL/public_id from DB:", updateError);
      showError("Failed to remove avatar URL from database.");
    } else {
      // Update local state for immediate visual feedback
      setProfileAvatarUrl(null);
      setProfileCloudinaryPublicId(null);
      showSuccess("Profile picture removed successfully!");
      refreshUser(); // Refresh AuthContext user if this is the logged-in user
    }
  };

  // Placeholder for handleMarkAsPassedOut function
  const handleMarkAsPassedOut = async () => {
    setIsTransitioning(true);
    try {
      if (!student) {
        showError("No student data to mark as passed out.");
        return;
      }

      // Update student status to 'passed-out'
      const { error: updateError } = await supabase
        .from('students')
        .update({ status: 'passed-out' })
        .eq('id', student.id);

      if (updateError) {
        throw new Error(`Failed to update student status: ${updateError.message}`);
      }

      // The database trigger `on_student_passed_out` will handle inserting into alumni table.
      showSuccess(`${student.name} has been marked as passed out and added to alumni records.`);
      setStudent(prev => prev ? { ...prev, status: 'passed-out' } : null); // Update local state
      navigate('/alumni'); // Redirect to alumni page
    } catch (err: any) {
      console.error("Error marking student as passed out:", err);
      showError(err.message || "Failed to mark student as passed out.");
    } finally {
      setIsTransitioning(false);
    }
  };

  const canEditAvatar = isAdminOrStaff || (authUser?.id === student?.user_id);

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
        <Link to="/students" className="mt-4 inline-flex items-center text-app-green hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
        </Link>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="px-0 py-6 text-center text-gray-600 text-lg">
        <p className="px-4">No student data available.</p>
        <Link to="/students" className="mt-4 inline-flex items-center text-app-green hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Student Details</h1>
        <div className="flex space-x-2">
          {isAdminOrStaff && student.status !== 'passed-out' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="bg-app-green text-white hover:bg-app-green/90" disabled={isTransitioning}>
                  <span>
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Passed Out
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Student Transition</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to mark {student.name} as "Passed Out" and add them to the alumni records? This action will update their status and trigger alumni record creation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMarkAsPassedOut} disabled={isTransitioning}>
                    {isTransitioning ? "Processing..." : "Confirm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Link to="/students">
            <Button variant="outline" className="text-deep-blue hover:bg-deep-blue/10">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
            </Button>
          </Link>
        </div>
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Comprehensive information for {student.name}.
      </p>

      <Card className="w-full max-w-4xl mx-auto rounded-none sm:rounded-lg">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-2xl font-semibold text-deep-blue">{student.name}</CardTitle>
          <Badge
            variant={
              student.status === "active"
                ? "default"
                : student.status === "passed-out"
                ? "secondary"
                : "destructive"
            }
            className="text-lg px-3 py-1"
          >
            {formatStatus(student.status)}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 px-4 sm:px-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-deep-blue flex items-center justify-center bg-gray-100 mb-4">
              {profileAvatarUrl ? (
                <img src={profileAvatarUrl} alt={`${student.name}'s avatar`} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <User className="h-20 w-20 text-gray-400" />
              )}
            </div>
            {student.user_id && ( // Only show ImageUpload if user_id is available
              <ImageUpload
                currentImageUrl={profileAvatarUrl}
                currentPublicId={profileCloudinaryPublicId} // Pass public_id
                onUploadSuccess={handleUploadSuccess}
                onRemoveSuccess={handleRemoveSuccess}
                userId={student.user_id} // Pass the Supabase auth.users.id
                label="Change Profile Picture"
                className="w-full max-w-sm"
                canEdit={canEditAvatar} // Pass the canEdit prop
              />
            )}
            {!student.user_id && (
              <p className="text-sm text-red-500 mt-2">
                Cannot upload avatar: Student profile is not linked to a user account.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Roll No.</p>
                <p className="text-base font-semibold">{student.rollno}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Semester</p>
                <p className="text-base font-semibold">{student.year}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-base font-semibold">{student.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Phone Number</p>
                <p className="text-base font-semibold">{student.phone_number || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 col-span-full">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-600">Address</p>
                <p className="text-base font-semibold">{student.address || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold text-deep-blue mb-2">Recent Attendance</h3>
            {recentAttendance.length === 0 ? (
              <p className="text-gray-600">No recent attendance records found.</p>
            ) : (
              <div className="rounded-md border bg-white p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{format(new Date(record.date), "PPP")}</TableCell>
                        <TableCell>{record.period}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "present"
                                ? "default"
                                : record.status === "absent"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {formatStatus(record.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/attendance-reports" className="text-app-green hover:underline inline-flex items-center">
                <ClipboardCheck className="mr-2 h-4 w-4" /> View Full Attendance Report
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDetail;