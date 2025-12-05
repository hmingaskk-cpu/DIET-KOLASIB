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
      if (!user || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch student profile based on user_id
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (studentError) {
          console.error("Error fetching student profile:", studentError.message);
          setError(`Failed to load student profile: ${studentError.message}. Please ensure your student details are added and linked.`);
          setLoading(false);
          return;
        }
        setStudentProfile(studentData as Student);

        if (studentData) {
          // 2. Fetch enrolled courses (using proper foreign key relationship if available)
          // If course_id exists in studentData, use that instead of title matching
          const courseFilter = studentData.course_id 
            ? { id: studentData.course_id }
            : { title: studentData.course };

          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .match(courseFilter);

          if (coursesError) {
            console.error("Error fetching enrolled courses:", coursesError);
            // Don't set error for courses - just log and continue
          } else {
            setEnrolledCourses(coursesData as Course[] || []);
          }

          // 3. Fetch personal attendance records
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentData.id)
            .order('date', { ascending: false })
            .limit(10);

          if (attendanceError) {
            console.error("Error fetching personal attendance:", attendanceError);
            // Don't set error for attendance - just log and continue
          } else {
            setPersonalAttendance(attendanceData as AttendanceRecord[] || []);
          }
        }

        // 4. Fetch upcoming events
        const today = new Date().toISOString().split('T')[0];
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendarEvents')
          .select('*')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(5);

        if (eventsError) {
          console.error("Error fetching upcoming events:", eventsError);
          // Don't set error for events - just log and continue
        } else {
          const fetchedEvents = (eventsData || []).map(event => ({
            ...event,
            date: new Date(event.date),
          })) as CalendarEvent[];
          setUpcomingEvents(fetchedEvents);
        }

      } catch (err: any) {
        console.error("Error in student dashboard data fetch:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

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

  if (authLoading || loading) {
    return (
      <div className="px-0 py-6 space-y-6">
        <Skeleton className="h-10 w-64 px-4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-4 sm:px-6">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
        <Skeleton className="h-8 w-48 px-4" />
        <Skeleton className="h-[200px] w-full px-4" />
        <Skeleton className="h-8 w-48 px-4" />
        <Skeleton className="h-[200px] w-full px-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-0 py-6 text-center text-red-500 text-lg">
        <p className="px-4">{error}</p>
        <p className="mt-2 px-4">Please try again later or contact support.</p>
      </div>
    );
  }

  if (!user || !studentProfile) {
    return (
      <div className="px-0 py-6 text-center text-gray-600 text-lg">
        <p className="px-4">No student profile found for your account.</p>
        <p className="mt-2 px-4">Please ensure your email is registered as a student and your student details are added in the system.</p>
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
    <div className="px-0 py-6">
      <h1 className="text-3xl font-bold mb-6 text-deep-blue px-4">Welcome, {studentProfile.name}!</h1>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Your personalized overview of academic information.
      </p>

      <div className="grid gap-6 lg:grid-cols-2 mt-8 px-4 sm:px-6">
        {/* Profile Card */}
        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-deep-blue flex items-center justify-center bg-gray-100 mb-4">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={`${studentProfile.name}'s avatar`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg class="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                      parent.appendChild(icon);
                    }
                  }}
                />
              ) : (
                <UserIcon className="h-20 w-20 text-gray-400" />
              )}
            </div>
            
            {user.id && (
              <ImageUpload
                currentImageUrl={user.avatar_url}
                currentPublicId={user.cloudinary_public_id}
                onUploadSuccess={handleUploadSuccess}
                onRemoveSuccess={handleRemoveSuccess}
                userId={user.id}
                label="Change Profile Picture"
                className="w-full max-w-sm"
                canEdit={true}
              />
            )}
            
            <p className="text-lg font-semibold mt-4">{studentProfile.name}</p>
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
        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Your Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {enrolledCourses.length === 0 ? (
              <p className="text-gray-600">No courses found for you.</p>
            ) : (
              <div className="rounded-md border bg-white p-2 max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Instructor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{course.title}</TableCell>
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
        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-600">No upcoming events.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-start space-x-3 p-2 border rounded-md bg-light-gray hover:bg-gray-50 transition-colors">
                    <CalendarDays className="h-5 w-5 text-deep-blue mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{format(event.date, "PPP")}</p>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary Card */}
        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Your Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
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
                className={cn(parseFloat(attendancePercentage) >= 75 ? "border-app-green" : "border-destructive")}
              />
            </div>
            <div className="mt-4 text-center">
              <Link 
                to="/attendance-reports" 
                className="text-app-green hover:underline inline-flex items-center hover:text-app-green-dark transition-colors"
              >
                <ClipboardCheck className="mr-2 h-4 w-4" /> 
                View Full Attendance Report
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Section */}
      <div className="mt-8 px-4 sm:px-6">
        <h2 className="text-2xl font-semibold mb-4 text-deep-blue">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
