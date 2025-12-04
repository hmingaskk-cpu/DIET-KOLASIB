"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardCard from "@/components/DashboardCard";
import { BookOpen, CalendarDays, Users, ClipboardCheck, UserSquare, FileText, UserX, Tag } from "lucide-react"; // Added Tag icon
import { format, isFuture } from "date-fns";
import QuickActionButton from "@/components/QuickActionButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Faculty as FacultyDetails } from "@/components/FacultyTable"; // Use FacultyDetails for the actual faculty record
import { Course } from "@/components/CourseTable";
import { AttendanceRecord } from "@/components/AttendanceForm";
import { CalendarEvent } from "@/components/CalendarEventForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { showError } from "@/utils/toast";
import { formatStatus } from "@/lib/utils";

const FacultyDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [facultyProfile, setFacultyProfile] = useState<FacultyDetails | null>(null); // Use FacultyDetails
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [classAttendanceSummary, setClassAttendanceSummary] = useState<{ totalStudents: number; present: number; absent: number; late: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch faculty profile based on user_id (which is user.id)
        const { data: facultyData, error: facultyError } = await supabase
          .from('faculty')
          .select('*')
          .eq('user_id', user.id) // Link by user_id
          .single();

        if (facultyError) {
          console.error("Error fetching faculty profile:", facultyError);
          setError("Failed to load faculty profile. Please ensure your faculty details are added in the system.");
          setLoading(false);
          return;
        }
        setFacultyProfile(facultyData as FacultyDetails);

        if (facultyData) {
          // 2. Fetch assigned courses (assuming instructor name matches faculty name)
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .eq('instructor', facultyData.name);

          if (coursesError) {
            console.error("Error fetching assigned courses:", coursesError);
            setError("Failed to load assigned courses.");
          } else {
            setAssignedCourses(coursesData as Course[]);
          }

          // 3. Fetch attendance summary for classes taught by this faculty
          // This is a simplified example; a real system might need more complex queries
          // to aggregate attendance across all periods/courses taught by the faculty.
          // For now, let's get a general overview of attendance records.
          const { data: attendanceRecords, error: attendanceError } = await supabase
            .from('attendance')
            .select(`
              status,
              students (
                course
              )
            `);

          if (attendanceError) {
            console.error("Error fetching attendance records:", attendanceError);
            setError("Failed to load attendance overview.");
          } else {
            let totalStudentsCounted = 0;
            let present = 0;
            let absent = 0;
            let late = 0;

            // Filter attendance records relevant to courses taught by this faculty
            const relevantAttendance = attendanceRecords?.filter(record =>
              assignedCourses.some(course => course.title === (record as any).students?.course)
            );

            relevantAttendance?.forEach(record => {
              if (record.status === 'present') present++;
              else if (record.status === 'absent') absent++;
              else if (record.status === 'late') late++;
            });

            // For total students, we'd ideally count unique students across assigned courses
            // For simplicity, let's just count unique student IDs from relevant attendance records
            const uniqueStudentIds = new Set(relevantAttendance?.map(rec => rec.student_id));
            totalStudentsCounted = uniqueStudentIds.size;

            setClassAttendanceSummary({
              totalStudents: totalStudentsCounted,
              present,
              absent,
              late,
            });
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
        console.error("Error in faculty dashboard data fetch:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, assignedCourses.length]); // Re-run if assignedCourses change

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

  if (!user || !facultyProfile) {
    return (
      <div className="px-0 py-6 text-center text-gray-600 text-lg">
        <p className="px-4">No faculty profile found for your account.</p>
        <p className="mt-2 px-4">Please ensure your email is registered as a faculty member and your faculty details are added in the system.</p>
      </div>
    );
  }

  return (
    <div className="px-0 py-6">
      <h1 className="text-3xl font-bold mb-6 text-deep-blue px-4">Welcome, {facultyProfile.name}!</h1>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Your personalized overview of teaching and academic information.
      </p>

      <h2 className="text-2xl font-semibold mb-4 text-deep-blue px-4">Class Attendance Overview</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
        <DashboardCard
          title="Your Abbreviation"
          value={facultyProfile.abbreviation || "N/A"}
          description="Your unique faculty code"
          icon={Tag}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Students (in your classes)"
          value={classAttendanceSummary?.totalStudents ?? 0}
          description="Unique students with attendance records in your courses"
          icon={Users}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Present Marks"
          value={classAttendanceSummary?.present ?? 0}
          description="Total times students marked present in your classes"
          icon={ClipboardCheck}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Absent Marks"
          value={classAttendanceSummary?.absent ?? 0}
          description="Total times students marked absent in your classes"
          icon={UserX}
          className="rounded-none sm:rounded-lg"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-8 px-4 sm:px-6">
        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Your Assigned Courses</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {assignedCourses.length === 0 ? (
              <p className="text-gray-600">No courses currently assigned to you.</p>
            ) : (
              <div className="rounded-md border bg-white p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              course.status === "active"
                                ? "default"
                                : course.status === "upcoming"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {formatStatus(course.status)}
                          </Badge>
                        </TableCell>
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
      </div>

      <div className="mt-8 px-4 sm:px-6">
        <h2 className="text-2xl font-semibold mb-4 text-deep-blue">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionButton
            to="/attendance"
            icon={ClipboardCheck}
            title="Take Attendance"
            description="Record student attendance for your classes."
            buttonText="Take Attendance"
          />
          <QuickActionButton
            to="/attendance-reports"
            icon={FileText}
            title="View Attendance Reports"
            description="Access detailed attendance analytics for your classes."
            buttonText="View Reports"
          />
          <QuickActionButton
            to="/resources"
            icon={BookOpen}
            title="Manage Resources"
            description="Upload and access educational materials."
            buttonText="View Resources"
          />
          <QuickActionButton
            to="/calendar"
            icon={CalendarDays}
            title="Academic Calendar"
            description="Stay updated with important dates."
            buttonText="View Calendar"
          />
          <QuickActionButton
            to="/profile"
            icon={UserSquare}
            title="View Profile"
            description="Check your personal and faculty details."
            buttonText="My Profile"
          />
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;