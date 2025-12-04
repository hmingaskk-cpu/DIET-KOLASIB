"use client";

import React, { useEffect, useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import StudentStatusChart from "@/components/StudentStatusChart";
import CourseStatusChart from "@/components/CourseStatusChart";
import FacultyStatusChart from "@/components/FacultyStatusChart";
import StudentsBySemesterChart from "@/components/StudentsBySemesterChart";
import AttendanceOverviewChart from "@/components/AttendanceOverviewChart";
import AlumniByGraduationYearChart from "@/components/AlumniByGraduationYearChart"; // Corrected import
import { Users, CheckCircle, GraduationCap, PauseCircle, BookOpen, PlayCircle, Clock, XCircle, UserSquare, Briefcase, HeartCrack, ClipboardCheck, UserX, UserPlus, FolderOpen, BarChart2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Student } from "@/components/StudentTable";
import { Course } from "@/components/CourseTable";
import { FacultyListItem } from "@/pages/Faculty";
import { AttendanceRecord } from "@/components/AttendanceForm";
import { Alumni } from "@/pages/Alumni";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";

const Reports = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<FacultyListItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [errorStudents, setErrorStudents] = useState<string | null>(null);
  const [errorCourses, setErrorCourses] = useState<string | null>(null);
  const [errorFaculty, setErrorFaculty] = useState<string | null>(null);
  const [errorAttendance, setErrorAttendance] = useState<string | null>(null);
  const [errorAlumni, setErrorAlumni] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      setErrorStudents(null);
      const { data, error } = await supabase.from('students').select('*');

      if (error) {
        console.error("Error fetching students for reports:", error);
        setErrorStudents("Failed to load student data for reports.");
        showError("Failed to load student data for reports.");
      } else {
        setStudents(data as Student[]);
      }
      setLoadingStudents(false);
    };

    const fetchCourses = async () => {
      setLoadingCourses(true);
      setErrorCourses(null);
      const { data, error } = await supabase.from('courses').select('*');

      if (error) {
        console.error("Error fetching courses for reports:", error);
        setErrorCourses("Failed to load course data for reports.");
        showError("Failed to load course data for reports.");
      } else {
        setCourses(data as Course[]);
      }
      setLoadingCourses(false);
    };

    const fetchFaculty = async () => {
      setLoadingFaculty(true);
      setErrorFaculty(null);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'faculty');
      if (profilesError) throw profilesError;
      setFaculty(profilesData as FacultyListItem[]);
      setLoadingFaculty(false);
    };

    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      setErrorAttendance(null);
      const { data, error } = await supabase.from('attendance').select('*');

      if (error) {
        console.error("Error fetching attendance for reports:", error);
        setErrorAttendance("Failed to load attendance data for reports.");
        showError("Failed to load attendance data for reports.");
      } else {
        setAttendance(data as AttendanceRecord[]);
      }
      setLoadingAttendance(false);
    };

    const fetchAlumni = async () => {
      setLoadingAlumni(true);
      setErrorAlumni(null);
      const { data, error } = await supabase.from('alumni').select('*');

      if (error) {
        console.error("Error fetching alumni for reports:", error);
        setErrorAlumni("Failed to load alumni data for reports.");
        showError("Failed to load alumni data for reports.");
      } else {
        setAlumni(data as Alumni[]);
      }
      setLoadingAlumni(false);
    };

    fetchStudents();
    fetchCourses();
    fetchFaculty();
    fetchAttendance();
    fetchAlumni();
  }, []);

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === "active").length;
  const passedOutStudents = students.filter(s => s.status === "passed-out").length;
  const onLeaveStudents = students.filter(s => s.status === "on-leave").length;

  const studentStatusData = [
    { name: "Active", students: activeStudents },
    { name: "Passed Out", students: passedOutStudents },
    { name: "On Leave", students: onLeaveStudents },
  ];

  const studentsBySemesterData = [
    { name: "1st Semester", students: students.filter(s => s.year === 1).length },
    { name: "2nd Semester", students: students.filter(s => s.year === 2).length },
    { name: "3rd Semester", students: students.filter(s => s.year === 3).length },
    { name: "4th Semester", students: students.filter(s => s.year === 4).length },
  ];

  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === "active").length;
  const inactiveCourses = courses.filter(c => c.status === "inactive").length;
  const upcomingCourses = courses.filter(c => c.status === "upcoming").length;

  const courseStatusData = [
    { name: "Active", courses: activeCourses },
    { name: "Inactive", courses: inactiveCourses },
    { name: "Upcoming", courses: upcomingCourses },
  ];

  const totalFaculty = faculty.length;
  const activeFaculty = faculty.filter(f => f.status === "active").length;
  const onLeaveFaculty = faculty.filter(f => f.status === "on-leave").length;
  const retiredFaculty = faculty.filter(f => f.status === "retired").length;

  const facultyStatusData = [
    { name: "Active", faculty: activeFaculty },
    { name: "On Leave", faculty: onLeaveFaculty },
    { name: "Retired", faculty: retiredFaculty },
  ];

  const totalAttendanceRecords = attendance.length;
  const presentCount = attendance.filter(rec => rec.status === 'present').length;
  const absentCount = attendance.filter(rec => rec.status === 'absent').length;
  const lateCount = attendance.filter(rec => rec.status === 'late').length;

  const attendanceOverviewData = [
    { name: "Present", value: presentCount },
    { name: "Absent", value: absentCount },
    { name: "Late", value: lateCount },
  ];

  const totalAlumni = alumni.length;
  const alumniByGraduationYearData = Array.from(
    alumni.reduce((acc, curr) => {
      const year = curr.graduation_year.toString();
      acc.set(year, (acc.get(year) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([year, count]) => ({ name: year, alumni: count })).sort((a, b) => parseInt(a.name) - parseInt(b.name));


  const anyLoading = loadingStudents || loadingCourses || loadingFaculty || loadingAttendance || loadingAlumni;

  return (
    <div className="px-0 py-6">
      <h1 className="text-3xl font-bold mb-6 text-deep-blue px-4">Reports & Analytics</h1>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Access detailed reports and analytics for DIET KOLASIB.
      </p>

      <h2 className="text-2xl font-semibold mb-4 text-deep-blue px-4">Student Overview</h2>
      {loadingStudents ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : errorStudents ? (
        <div className="text-center text-red-500 text-lg mb-8 px-4 sm:px-6">{errorStudents}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <DashboardCard
            title="Total Students"
            value={totalStudents}
            description="Overall student count"
            icon={Users}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Active Students"
            value={activeStudents}
            description="Currently enrolled and active"
            icon={CheckCircle}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Passed Out Students"
            value={passedOutStudents}
            description="Students who have graduated"
            icon={GraduationCap}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Students On Leave"
            value={onLeaveStudents}
            description="Students temporarily on leave"
            icon={PauseCircle}
            className="rounded-none sm:rounded-lg"
          />
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4 text-deep-blue mt-8 px-4">Course Overview</h2>
      {loadingCourses ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : errorCourses ? (
        <div className="text-center text-red-500 text-lg mb-8 px-4 sm:px-6">{errorCourses}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <DashboardCard
            title="Total Courses"
            value={totalCourses}
            description="All courses offered"
            icon={BookOpen}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Active Courses"
            value={activeCourses}
            description="Currently running courses"
            icon={PlayCircle}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Upcoming Courses"
            value={upcomingCourses}
            description="Courses scheduled for future"
            icon={Clock}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Inactive Courses"
            value={inactiveCourses}
            description="Courses not currently offered"
            icon={XCircle}
            className="rounded-none sm:rounded-lg"
          />
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4 text-deep-blue mt-8 px-4">Faculty Overview</h2>
      {loadingFaculty ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : errorFaculty ? (
        <div className="text-center text-red-500 text-lg mb-8 px-4 sm:px-6">{errorFaculty}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <DashboardCard
            title="Total Faculty"
            value={totalFaculty}
            description="Overall faculty count"
            icon={UserSquare}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Active Faculty"
            value={activeFaculty}
            description="Currently active faculty members"
            icon={Briefcase}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Faculty On Leave"
            value={onLeaveFaculty}
            description="Faculty members temporarily on leave"
            icon={PauseCircle}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Retired Faculty"
            value={retiredFaculty}
            description="Faculty members who have retired"
            icon={HeartCrack}
            className="rounded-none sm:rounded-lg"
          />
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4 text-deep-blue mt-8 px-4">Attendance Overview</h2>
      {loadingAttendance ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : errorAttendance ? (
        <div className="text-center text-red-500 text-lg mb-8 px-4 sm:px-6">{errorAttendance}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <DashboardCard
            title="Total Attendance Records"
            value={totalAttendanceRecords}
            description="All recorded attendance entries"
            icon={ClipboardCheck}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Present Marks"
            value={presentCount}
            description="Total times students marked present"
            icon={CheckCircle}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Absent Marks"
            value={absentCount}
            description="Total times students marked absent"
            icon={UserX}
            className="rounded-none sm:rounded-lg"
          />
          <DashboardCard
            title="Late Marks"
            value={lateCount}
            description="Total times students marked late"
            icon={Clock}
            className="rounded-none sm:rounded-lg"
          />
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4 text-deep-blue mt-8 px-4">Alumni Overview</h2>
      {loadingAlumni ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : errorAlumni ? (
        <div className="text-center text-red-500 text-lg mb-8 px-4 sm:px-6">{errorAlumni}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 px-4 sm:px-6">
          <DashboardCard
            title="Total Alumni"
            value={totalAlumni}
            description="Former students of DIET KOLASIB"
            icon={UserPlus}
            className="rounded-none sm:rounded-lg"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 mt-8 px-4 sm:px-6">
        {anyLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <>
            <StudentStatusChart data={studentStatusData} />
            <StudentsBySemesterChart data={studentsBySemesterData} />
          </>
        )}

        {loadingCourses || errorCourses ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <CourseStatusChart data={courseStatusData} />
        )}

        {loadingFaculty || errorFaculty ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <FacultyStatusChart data={facultyStatusData} />
        )}

        {loadingAttendance || errorAttendance ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <AttendanceOverviewChart data={attendanceOverviewData} />
        )}

        {loadingAlumni || errorAlumni ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <AlumniByGraduationYearChart data={alumniByGraduationYearData} />
        )}
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

export default Reports;