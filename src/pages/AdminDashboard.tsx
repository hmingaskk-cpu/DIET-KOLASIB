"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardCard from "@/components/DashboardCard";
import { BookOpen, BarChart2, Users, CalendarDays, GraduationCap, UserSquare, ClipboardCheck, UserX, FolderOpen, UserPlus, CheckCircle } from "lucide-react";
import { isFuture } from "date-fns";
import QuickActionButton from "@/components/QuickActionButton";
import { supabase } from "@/lib/supabase";
import { Student } from "@/components/StudentTable";
import { Course } from "@/components/CourseTable";
import { FacultyListItem } from "./Faculty"; // Import FacultyListItem
import { CalendarEvent } from "@/components/CalendarEventForm";
import { AttendanceRecord } from "@/components/AttendanceForm";
import { Skeleton } from "@/components/ui/skeleton";
import StudentsBySemesterChart from "@/components/StudentsBySemesterChart";
import { showError } from "@/utils/toast"; // Import showError

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<FacultyListItem[]>([]); // Use FacultyListItem
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [alumniCount, setAlumniCount] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setError(null); // Clear previous errors

      try {
        setLoadingStudents(true);
        const { data: studentsData, error: studentsError } = await supabase.from('students').select('*');
        if (studentsError) throw studentsError;
        setStudents(studentsData as Student[]);
      } catch (e: any) {
        console.error("Error fetching students for dashboard:", e);
        setError(prev => prev ? prev + "\n" + e.message : e.message);
        showError("Failed to load student data.");
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }

      try {
        setLoadingCourses(true);
        const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*');
        if (coursesError) throw coursesError;
        setCourses(coursesData as Course[]);
      } catch (e: any) {
        console.error("Error fetching courses for dashboard:", e);
        setError(prev => prev ? prev + "\n" + e.message : e.message);
        showError("Failed to load course data.");
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }

      try {
        setLoadingFaculty(true);
        // Fetch profiles with 'faculty' role for count
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('role', 'faculty');
        if (profilesError) throw profilesError;
        // For dashboard count, we just need the number of profiles with 'faculty' role
        setFaculty(profilesData as FacultyListItem[]);
      } catch (e: any) {
        console.error("Error fetching faculty for dashboard:", e);
        setError(prev => prev ? prev + "\n" + e.message : e.message);
        showError("Failed to load faculty data.");
        setFaculty([]);
      } finally {
        setLoadingFaculty(false);
      }

      try {
        setLoadingEvents(true);
        const { data: eventsData, error: eventsError } = await supabase.from('calendarEvents').select('*');
        if (eventsError) throw eventsError;
        const fetchedEvents = eventsData.map(event => ({
          ...event,
          date: new Date(event.date),
        })) as CalendarEvent[];
        setEvents(fetchedEvents);
      } catch (e: any) {
        console.error("Error fetching calendar events for dashboard:", e);
        setError(prev => prev ? prev + "\n" + e.message : e.message);
        showError("Failed to load event data.");
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }

      try {
        setLoadingAttendance(true);
        const { data: attendanceData, error: attendanceError } = await supabase.from('attendance').select('*');
        if (attendanceError) throw attendanceError;
        setAttendance(attendanceData as AttendanceRecord[]);
      } catch (e: any) {
        console.error("Error fetching attendance for dashboard:", e);
        setError(prev => prev ? prev + "\n" + e.message : e.message);
        showError("Failed to load attendance data.");
        setAttendance([]);
      } finally {
        setLoadingAttendance(false);
      }

      try {
        setLoadingAlumni(true);
        const { count, error: alumniError } = await supabase.from('alumni').select('*', { count: 'exact' });
        if (alumniError) throw alumniError;
        setAlumniCount(count || 0);
      } catch (e: any) {
        console.error("Error fetching alumni count for dashboard:", e);
        setError(prev => prev ? prev + "\n" + e.message : e.message);
        showError("Failed to load alumni count.");
        setAlumniCount(0);
      } finally {
        setLoadingAlumni(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalCourses = courses.length;
  const totalStudents = students.length;
  const totalFaculty = faculty.length; // Now correctly reflects profiles with 'faculty' role
  const upcomingEventsCount = events.filter(event => isFuture(event.date)).length;
  const graduates = students.filter(student => student.status === "passed-out").length;

  const totalAttendanceRecords = attendance.length;
  const presentCount = attendance.filter(rec => rec.status === 'present').length;
  const absentCount = attendance.filter(rec => rec.status === 'absent').length;

  const studentsBySemesterData = [
    { name: "1st Semester", students: students.filter(s => s.year === 1).length },
    { name: "2nd Semester", students: students.filter(s => s.year === 2).length },
    { name: "3rd Semester", students: students.filter(s => s.year === 3).length },
    { name: "4th Semester", students: students.filter(s => s.year === 4).length },
  ];

  const anyLoading = loadingStudents || loadingCourses || loadingFaculty || loadingEvents || loadingAttendance || loadingAlumni;

  return (
    <div className="px-0 py-6">
      <h1 className="text-3xl font-bold mb-6 text-deep-blue px-4">Admin Dashboard</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-4 sm:mx-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-4 sm:px-6">
        <DashboardCard
          title="Total Courses"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : totalCourses}
          description="Currently active courses"
          icon={BookOpen}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Students"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : totalStudents}
          description="Enrolled students this year"
          icon={Users}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Faculty"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : totalFaculty}
          description="Active faculty members"
          icon={UserSquare}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Upcoming Events"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : upcomingEventsCount}
          description="Events in the near future"
          icon={CalendarDays}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Graduates"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : graduates}
          description="Students who have passed out"
          icon={GraduationCap}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Attendance Records"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : totalAttendanceRecords}
          description="All recorded attendance entries"
          icon={ClipboardCheck}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Present Marks"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : presentCount}
          description="Overall present marks"
          icon={CheckCircle}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Absent Marks"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : absentCount}
          description="Overall absent marks"
          icon={UserX}
          className="rounded-none sm:rounded-lg"
        />
        <DashboardCard
          title="Total Alumni"
          value={anyLoading ? <Skeleton className="h-6 w-1/2" /> : alumniCount}
          description="Former students of DIET KOLASIB"
          icon={GraduationCap}
          className="rounded-none sm:rounded-lg"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 px-4 sm:px-6">
        {anyLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <StudentsBySemesterChart data={studentsBySemesterData} />
        )}
        {/* Placeholder for other charts or content */}
      </div>

      <div className="mt-8 px-4 sm:px-6">
        <h2 className="text-2xl font-semibold mb-4 text-deep-blue">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionButton
            to="/students"
            icon={Users}
            title="Add New Student"
            description="Enroll a new student into the system."
            buttonText="Add Student"
          />
          <QuickActionButton
            to="/courses"
            icon={BookOpen}
            title="Create New Course"
            description="Define a new course offering."
            buttonText="Create Course"
          />
          <QuickActionButton
            to="/faculty"
            icon={UserSquare}
            title="Add New Faculty"
            description="Add a new faculty member."
            buttonText="Add Faculty"
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
            icon={BarChart2}
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

export default AdminDashboard;