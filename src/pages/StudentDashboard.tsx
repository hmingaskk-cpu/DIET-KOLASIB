"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardCard from "@/components/DashboardCard";
import { BookOpen, CalendarDays, CheckCircle, UserX, ClipboardCheck, GraduationCap, Mail, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Student } from "@/components/StudentTable";
import { Course } from "@/components/CourseTable";
import { CalendarEvent } from "@/components/CalendarEventForm";
import { AttendanceRecord } from "@/components/AttendanceForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatStatus, cn } from "@/lib/utils";
import QuickActionButton from "@/components/QuickActionButton";
import ImageUpload from "@/components/ImageUpload";
import { showError, showSuccess } from "@/utils/toast";

const StudentDashboard = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [personalAttendance, setPersonalAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || authLoading) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch student profile based on user_id
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle instead of single

        if (studentError) {
          console.error("Error fetching student profile:", studentError);
          throw studentError;
        }

        if (!studentData) {
          // Try alternative: fetch by email if user_id doesn't match
          const { data: studentByEmail } = await supabase
            .from('students')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
            
          if (studentByEmail) {
            setStudentProfile(studentByEmail as Student);
            // Update the user_id if it's missing
            if (!studentByEmail.user_id) {
              await supabase
                .from('students')
                .update({ user_id: user.id })
                .eq('id', studentByEmail.id);
            }
          } else {
            setLoading(false);
            return; // No student profile found
          }
        } else {
          setStudentProfile(studentData as Student);
        }

      } catch (err: any) {
        console.error("Error fetching student data:", err);
        setError(err.message || "Failed to load student data");
        setLoading(false);
        return;
      }

      try {
        // Only proceed if we have studentProfile
        if (!studentProfile) {
          setLoading(false);
          return;
        }

        // 2. Fetch enrolled courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('course_code', studentProfile.course || studentProfile.course_code)
          .limit(5);

        if (!coursesError && coursesData) {
          setEnrolledCourses(coursesData as Course[]);
        }

        // 3. Fetch personal attendance records
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentProfile.id)
          .order('date', { ascending: false })
          .limit(10);

        if (!attendanceError && attendanceData) {
          setPersonalAttendance(attendanceData as AttendanceRecord[]);
        }

        // 4. Fetch upcoming events
        const today = new Date().toISOString().split('T')[0];
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(5);

        if (!eventsError && eventsData) {
          const fetchedEvents = eventsData.map(event => ({
            ...event,
            date: new Date(event.date),
          })) as CalendarEvent[];
          setUpcomingEvents(fetchedEvents);
        }

      } catch (err: any) {
        console.error("Error fetching additional data:", err);
        // Don't set error here, just log and continue
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure auth is fully loaded
    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timer);
  }, [user, authLoading, studentProfile?.id]); // Add studentProfile.id as dependency

  const handleUploadSuccess = async (imageUrl: string, publicId: string) => {
    if (!user?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: imageUrl, 
          cloudinary_public_id: publicId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      showSuccess("Profile picture updated successfully!");
      refreshUser();
    } catch (error: any) {
      console.error("Error updating profile avatar URL:", error);
      showError("Failed to update profile picture. Please try again.");
    }
  };

  const handleRemoveSuccess = async () => {
    if (!user?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null, 
          cloudinary_public_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      showSuccess("Profile picture removed successfully!");
      refreshUser();
    } catch (error: any) {
      console.error("Error removing profile avatar URL:", error);
      showError("Failed to remove profile picture. Please try again.");
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No user or student profile
  if (!user || !studentProfile) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">Student Profile Not Found</h2>
          <p className="text-yellow-600 mb-4">
            Your account is not linked to a student profile. Please contact the administrator.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Email: {user?.email || 'Not available'}</p>
            <p>User ID: {user?.id?.substring(0, 8)}...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate attendance summary
  const totalPeriods = personalAttendance.length;
  const presentCount = personalAttendance.filter(rec => rec.status === 'present').length;
  const absentCount = personalAttendance.filter(rec => rec.status === 'absent').length;
  const lateCount = personalAttendance.filter(rec => rec.status === 'late').length;
  const attendancePercentage = totalPeriods > 0
    ? (((presentCount + lateCount) / totalPeriods) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2 text-deep-blue">Welcome, {studentProfile.name}!</h1>
      <p className="text-lg text-gray-700 mb-6">
        Your personalized overview of academic information.
      </p>

      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-deep-blue">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-deep-blue flex items-center justify-center bg-gray-100 mb-4">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={`${studentProfile.name}'s avatar`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'flex items-center justify-center h-full w-full';
                      fallback.innerHTML = '<svg class="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <UserIcon className="h-20 w-20 text-gray-400" />
              )}
            </div>
            
            <ImageUpload
              currentImageUrl={user.avatar_url}
              currentPublicId={user.cloudinary_public_id}
              onUploadSuccess={handleUploadSuccess}
              onRemoveSuccess={handleRemoveSuccess}
              userId={user.id}
              label="Change Profile Picture"
              className="w-full max-w-sm mb-4"
              canEdit={true}
            />
            
            <p className="text-lg font-semibold mt-2">{studentProfile.name}</p>
            <p className="text-sm text-muted-foreground">{studentProfile.email}</p>
            <p className="text-sm text-muted-foreground">Roll No: {studentProfile.rollno}</p>
            <p className="text-sm text-muted-foreground">Semester: {studentProfile.year}</p>
            <Badge
              variant={
                studentProfile.status === "active"
                  ? "default"
                  : studentProfile.status === "passed-out"
                  ? "secondary"
                  : "destructive"
              }
              className="mt-2"
            >
              {formatStatus(studentProfile.status)}
            </Badge>
          </CardContent>
        </Card>

        {/* Enrolled Courses Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-deep-blue">Your Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No courses enrolled yet</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Code</TableHead>
                      <TableHead className="w-1/2">Title</TableHead>
                      <TableHead className="w-1/4">Instructor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell className="truncate">{course.title}</TableCell>
                        <TableCell>{course.instructor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-deep-blue">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <CalendarDays className="h-5 w-5 text-deep-blue mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.date, "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-deep-blue">Your Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <DashboardCard
                title="Total Periods"
                value={totalPeriods}
                description="Periods recorded"
                icon={ClipboardCheck}
              />
              <DashboardCard
                title="Present"
                value={presentCount}
                description="Times marked present"
                icon={CheckCircle}
              />
              <DashboardCard
                title="Absent"
                value={absentCount}
                description="Times marked absent"
                icon={UserX}
              />
              <DashboardCard
                title="Attendance %"
                value={`${attendancePercentage}%`}
                description="Overall attendance rate"
                icon={GraduationCap}
                className={cn(
                  "border-2",
                  parseFloat(attendancePercentage) >= 75 
                    ? "border-green-200 bg-green-50" 
                    : "border-red-200 bg-red-50"
                )}
              />
            </div>
            {totalPeriods > 0 && (
              <div className="mt-6 text-center">
                <Link 
                  to="/attendance-reports" 
                  className="inline-flex items-center px-4 py-2 bg-app-green text-white rounded-lg hover:bg-app-green-dark transition-colors"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" /> 
                  View Full Attendance Report
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-deep-blue">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickActionButton
            to="/profile"
            icon={UserIcon}
            title="View Profile"
            description="Check your personal and academic details."
            buttonText="My Profile"
          />
          <QuickActionButton
            to="/attendance-reports"
            icon={ClipboardCheck}
            title="Detailed Attendance"
            description="Review your full attendance history."
            buttonText="View Reports"
          />
          <QuickActionButton
            to="/calendar"
            icon={CalendarDays}
            title="Academic Calendar"
            description="Stay updated with important dates."
            buttonText="View Calendar"
          />
          <QuickActionButton
            to="/resources"
            icon={BookOpen}
            title="Access Resources"
            description="Download study materials and notices."
            buttonText="View Resources"
          />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
