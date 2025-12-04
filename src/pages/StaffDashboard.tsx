"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardCard from "@/components/DashboardCard";
import { Users, BookOpen, UserSquare, CalendarDays, FolderOpen, BarChart2, UserPlus, ClipboardCheck, FileText } from "lucide-react";
import QuickActionButton from "@/components/QuickActionButton";
import { supabase } from "@/lib/supabase";
import { Student } from "@/components/StudentTable";
import { Course } from "@/components/CourseTable";
import { FacultyListItem } from "./Faculty"; // Import FacultyListItem
import { CalendarEvent } from "@/components/CalendarEventForm";
import { Alumni } from "@/pages/Alumni";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { format, isFuture } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StaffDashboard = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalFaculty, setTotalFaculty] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [totalAlumni, setTotalAlumni] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch total students
        const { count: studentsCount, error: studentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact' });
        if (studentsError) throw studentsError;
        setTotalStudents(studentsCount || 0);

        // Fetch total courses
        const { count: coursesCount, error: coursesError } = await supabase
          .from('courses')
          .select('*', { count: 'exact' });
        if (coursesError) throw coursesError;
        setTotalCourses(coursesCount || 0);

        // Fetch total faculty (from profiles with 'faculty' role)
        const { count: facultyCount, error: facultyError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('role', 'faculty');
        if (facultyError) throw facultyError;
        setTotalFaculty(facultyCount || 0);

        // Fetch total alumni
        const { count: alumniCount, error: alumniError } = await supabase
          .from('alumni')
          .select('*', { count: 'exact' });
        if (alumniError) throw alumniError;
        setTotalAlumni(alumniCount || 0);

        // Fetch upcoming events
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendarEvents')
          .select('*')
          .order('date', { ascending: true })
          .gte('date', format(new Date(), 'yyyy-MM-dd')) // Only future events
          .limit(5);
        if (eventsError) throw eventsError;
        const fetchedEvents = eventsData.map(event => ({
          ...event,
          date: new Date(event.date),
        })) as CalendarEvent[];
        setUpcomingEvents(fetchedEvents);
        setUpcomingEventsCount(fetchedEvents.length);

      } catch (err: any) {
        console.error("Error fetching staff dashboard data:", err);
        setError(err.message || "Failed to load dashboard data.");
        showError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
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

  return (
    <div className="px-0 py-6">
      <h1 className="text-3xl font-bold mb-6 text-deep-blue px-4">Staff Dashboard</h1>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Quick overview and access to administrative tasks.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
        <DashboardCard
          title="Total Students"
          value={totalStudents}
          description="Currently enrolled students"
          icon={Users}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Faculty"
          value={totalFaculty}
          description="Active faculty members"
          icon={UserSquare}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Courses"
          value={totalCourses}
          description="All courses offered"
          icon={BookOpen}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Alumni"
          value={totalAlumni}
          description="Former students of DIET KOLASIB"
          icon={UserPlus}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Upcoming Events"
          value={upcomingEventsCount}
          description="Events in the near future"
          icon={CalendarDays}
          className="rounded-none sm:rounded-lg"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-8 px-4 sm:px-6">
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
        {/* Placeholder for other staff-specific widgets */}
        <Card className="rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-deep-blue">Announcements</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600">No new announcements.</p>
            {/* Future: Display recent announcements or internal memos */}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 px-4 sm:px-6">
        <h2 className="text-2xl font-semibold mb-4 text-deep-blue">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionButton
            to="/students"
            icon={Users}
            title="Manage Students"
            description="View, add, edit, or delete student records."
            buttonText="Go to Students"
          />
          <QuickActionButton
            to="/faculty"
            icon={UserSquare}
            title="Manage Faculty"
            description="View, add, edit, or delete faculty records."
            buttonText="Go to Faculty"
          />
          <QuickActionButton
            to="/courses"
            icon={BookOpen}
            title="Manage Courses"
            description="View, add, edit, or delete course offerings."
            buttonText="Go to Courses"
          />
          <QuickActionButton
            to="/attendance"
            icon={ClipboardCheck}
            title="Take Attendance"
            description="Record student attendance for classes."
            buttonText="Take Attendance"
          />
          <QuickActionButton
            to="/attendance-reports"
            icon={FileText}
            title="View Attendance Reports"
            description="Access detailed attendance analytics."
            buttonText="View Reports"
          />
          <QuickActionButton
            to="/resources"
            icon={FolderOpen}
            title="Manage Resources"
            description="Upload and access educational materials."
            buttonText="View Resources"
          />
          <QuickActionButton
            to="/alumni"
            icon={UserPlus}
            title="Manage Alumni"
            description="Add and manage records of former students."
            buttonText="View Alumni"
          />
          <QuickActionButton
            to="/calendar"
            icon={CalendarDays}
            title="Academic Calendar"
            description="Manage and view important dates."
            buttonText="View Calendar"
          />
          <QuickActionButton
            to="/reports"
            icon={BarChart2}
            title="View General Reports"
            description="Access detailed analytics and reports."
            buttonText="View Reports"
          />
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;