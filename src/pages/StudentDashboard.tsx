"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardCard from "@/components/DashboardCard";
import { BookOpen, CalendarDays, CheckCircle, UserX, ClipboardCheck, GraduationCap, Mail, User as UserIcon } from "lucide-react"; // Added UserIcon
import { isFuture, format, parseISO } from "date-fns";
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
import { formatStatus, cn } from "@/lib/utils"; // Import cn
import QuickActionButton from "@/components/QuickActionButton";
import ImageUpload from "@/components/ImageUpload"; // Import ImageUpload
import { showError, showSuccess } from "@/utils/toast"; // Import showError, showSuccess

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
          .eq('user_id', user.id) // Link by user_id
          .single();

        if (studentError) {
          console.error("Error fetching student profile:", studentError.message); // Log specific error message
          setError(`Failed to load student profile: ${studentError.message}. Please ensure your student details are added and linked.`);
          setLoading(false);
          return;
        }
        setStudentProfile(studentData as Student);

        if (studentData) {
          // 2. Fetch enrolled courses (assuming course is a string match for now)
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .eq('title', studentData.course); // Match by course title

          if (coursesError) {
            console.error("Error fetching enrolled courses:", coursesError);
            setError("Failed to load enrolled courses.");
          } else {
            setEnrolledCourses(coursesData as Course[]);
          }

          // 3. Fetch personal attendance records
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentData.id)
            .order('date', { ascending: false })
            .limit(10); // Show recent attendance

          if (attendanceError) {
            console.error("Error fetching personal attendance:", attendanceError);
            setError("Failed to load personal attendance.");
          } else {
            setPersonalAttendance(attendanceData as AttendanceRecord[]);
          }
        }

        // 4. Fetch upcoming events
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendarEvents')
          .select('*')
          .order('date', { ascending: true })
          .gte('date', format(new Date(), 'yyyy-MM-dd')) // Only future events
          .limit(5);

        if (eventsError) {
          console.error("Error fetching upcoming events:", eventsError);
          setError("Failed to load upcoming events.");
        } else {
          const fetchedEvents = eventsData.map(event => ({
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
    if (!user?.id) return; // Use user.id from AuthContext

    const { error: updateError } = await supabase
      .from('profiles') // Update profiles table
      .update({ avatar_url: imageUrl, cloudinary_public_id: publicId }) // Update public_id too
      .eq('id', user.id); // Match by user.id

    if (updateError) {
      console.error("Error updating profile avatar URL in DB:", updateError);
      showError("Failed to update avatar URL in database.");
    } else {
      showSuccess("Profile picture updated successfully!");
      refreshUser(); // Refresh AuthContext user to get updated avatar_url
    }
  };

  const handleRemoveSuccess = async () => {
    if (!user?.id) return; // Use user.id from AuthContext

    const { error: updateError } = await supabase
      .from('profiles') // Update profiles table
      .update({ avatar_url: null, cloudinary_public_id: null }) // Clear public_id too
      .eq('id', user.id); // Match by user.id

    if (updateError) {
      console.error("Error removing profile avatar URL from DB:", updateError);
      showError("Failed to remove avatar URL from database.");
    } else {
      showSuccess("Profile picture removed successfully!");
      refreshUser(); // Refresh AuthContext user to get updated avatar_url
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
        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-deep-blue flex items-center justify-center bg-gray-100 mb-4">
              {user.avatar_url ? ( // Use user.avatar_url from AuthContext
                <img src={user.avatar_url} alt={`${studentProfile.name}'s avatar`} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <UserIcon className="h-20 w-20 text-gray-400" />
              )}
            </div>
            {user.id && ( // Only show ImageUpload if user_id is available
              <ImageUpload
                currentImageUrl={user.avatar_url} // Use user.avatar_url from AuthContext
                currentPublicId={user.cloudinary_public_id} // Pass public_id from AuthContext
                onUploadSuccess={handleUploadSuccess}
                onRemoveSuccess={handleRemoveSuccess}
                userId={user.id} // Pass the Supabase auth.users.id
                label="Change Profile Picture"
                className="w-full max-w-sm"
                canEdit={true} // Student can always edit their own profile picture
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

        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Your Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {enrolledCourses.length === 0 ? (
              <p className="text-gray-600">No courses found for you.</p>
            ) : (
              <div className="rounded-md border bg-white p-2">
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
                        <TableCell>{course.title}</TableCell>
                        <TableCell>{course.instructor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-600">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center space-x-3 p-2 border rounded-md bg-light-gray">
                    <CalendarDays className="h-5 w-5 text-deep-blue" />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{format(event.date, "PPP")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
              <Link to="/attendance-reports" className="text-app-green hover:underline inline-flex items-center">
                <ClipboardCheck className="mr-2 h-4 w-4" /> View Full Attendance Report
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 px-4 sm:px-6">
        <h2 className="text-2xl font-semibold mb-4 text-deep-blue">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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