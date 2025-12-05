"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardCard from "@/components/DashboardCard";
import { BookOpen, CalendarDays, Users, ClipboardCheck, UserSquare, FileText, UserX, Tag } from "lucide-react";
import { format } from "date-fns";
import QuickActionButton from "@/components/QuickActionButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Faculty as FacultyDetails } from "@/components/FacultyTable";
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
  const [facultyProfile, setFacultyProfile] = useState<FacultyDetails | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [classAttendanceSummary, setClassAttendanceSummary] = useState<{ 
    totalStudents: number; 
    present: number; 
    absent: number; 
    late: number; 
  } | null>(null);
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
        // 1. Fetch faculty profile based on user_id
        const { data: facultyData, error: facultyError } = await supabase
          .from('faculty')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (facultyError) {
          console.error("Error fetching faculty profile:", facultyError);
          throw facultyError;
        }

        if (!facultyData) {
          // Try alternative: fetch by email
          const { data: facultyByEmail } = await supabase
            .from('faculty')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
            
          if (facultyByEmail) {
            setFacultyProfile(facultyByEmail as FacultyDetails);
            // Update user_id if missing
            if (!facultyByEmail.user_id) {
              await supabase
                .from('faculty')
                .update({ user_id: user.id })
                .eq('id', facultyByEmail.id);
            }
          } else {
            setLoading(false);
            return;
          }
        } else {
          setFacultyProfile(facultyData as FacultyDetails);
        }

      } catch (err: any) {
        console.error("Error fetching faculty data:", err);
        setError(err.message || "Failed to load faculty data");
        setLoading(false);
        return;
      }

      try {
        // Only proceed if we have facultyProfile
        if (!facultyProfile) {
          setLoading(false);
          return;
        }

        // 2. Fetch assigned courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor', facultyProfile.name)
          .limit(10);

        if (!coursesError && coursesData) {
          setAssignedCourses(coursesData as Course[]);
        }

        // 3. Fetch attendance summary for this faculty's courses
        // First get all student IDs in the faculty's courses
        let studentIds: string[] = [];
        
        if (coursesData && coursesData.length > 0) {
          const courseTitles = coursesData.map(course => course.title);
          
          // Fetch students enrolled in these courses
          const { data: studentsData } = await supabase
            .from('students')
            .select('id')
            .in('course', courseTitles);

          if (studentsData) {
            studentIds = studentsData.map(student => student.id);
          }
        }

        // Fetch attendance records for these students
        if (studentIds.length > 0) {
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('*')
            .in('student_id', studentIds)
            .limit(100); // Limit for performance

          if (attendanceData) {
            let present = 0;
            let absent = 0;
            let late = 0;

            attendanceData.forEach(record => {
              if (record.status === 'present') present++;
              else if (record.status === 'absent') absent++;
              else if (record.status === 'late') late++;
            });

            setClassAttendanceSummary({
              totalStudents: studentIds.length,
              present,
              absent,
              late,
            });
          }
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
        // Don't set error, just log and continue
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timer);
  }, [user, authLoading, facultyProfile?.id]);

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

  if (!user || !facultyProfile) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">Faculty Profile Not Found</h2>
          <p className="text-yellow-600 mb-4">
            Your account is not linked to a faculty profile. Please contact the administrator.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Email: {user?.email || 'Not available'}</p>
            <p>User ID: {user?.id?.substring(0, 8)}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2 text-deep-blue">Welcome, {facultyProfile.name}!</h1>
      <p className="text-lg text-gray-700 mb-6">
        Your personalized overview of teaching and academic information.
      </p>

      <h2 className="text-2xl font-semibold mb-4 text-deep-blue">Class Attendance Overview</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardCard
          title="Your Abbreviation"
          value={facultyProfile.abbreviation || "N/A"}
          description="Your unique faculty code"
          icon={Tag}
        />
        <DashboardCard
          title="Total Students"
          value={classAttendanceSummary?.totalStudents ?? 0}
          description="Students in your assigned courses"
          icon={Users}
        />
        <DashboardCard
          title="Present Marks"
          value={classAttendanceSummary?.present ?? 0}
          description="Total present marks in your classes"
          icon={ClipboardCheck}
        />
        <DashboardCard
          title="Absent Marks"
          value={classAttendanceSummary?.absent ?? 0}
          description="Total absent marks in your classes"
          icon={UserX}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        {/* Assigned Courses Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-deep-blue">Your Assigned Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {assignedCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No courses currently assigned to you</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Code</TableHead>
                      <TableHead className="w-1/2">Title</TableHead>
                      <TableHead className="w-1/4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell className="truncate">{course.title}</TableCell>
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
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-deep-blue">Quick Actions</h2>
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
