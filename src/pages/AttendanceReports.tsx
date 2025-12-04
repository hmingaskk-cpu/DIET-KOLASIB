"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, getMonth, getYear, startOfYear, endOfYear } from "date-fns"; // Added startOfYear, endOfYear
import { Calendar as CalendarIcon, Download, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatStatus, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Student } from "@/components/StudentTable";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AttendanceReportTable from "@/components/AttendanceReportTable";

interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  rollno: string;
  semester: number;
  total_periods: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  percentage: string;
}

interface DailyAttendance {
  id: string;
  date: string;
  rollno: string;
  name: string;
  periods: { [key: number]: 'P' | 'A' | '' };
}

const AttendanceReports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [studentsListForSelector, setStudentsListForSelector] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // Default to "all"
  const [selectedYear, setSelectedYear] = useState<string>(getYear(new Date()).toString());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState<"all" | string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | "all">("all");
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<Set<string>>(new Set());

  const months = [
    { value: "all", label: "All Months" }, // New "All Months" option
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const currentYear = getYear(new Date());
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString()); // Current year +/- 2

  useEffect(() => {
    const fetchStudentsForSelector = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('students')
        .select('id, name, rollno')
        .order('name', { ascending: true });

      if (filterSemester !== "all") {
        query = query.eq('year', parseInt(filterSemester));
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching students for selector:", error);
        showError("Failed to load students for selection.");
        setStudentsListForSelector([]);
      } else {
        setStudentsListForSelector(data as Student[]);
      }
      setSelectedStudentId("all");
      setLoading(false);
    };
    fetchStudentsForSelector();
  }, [filterSemester]);

  const fetchAttendanceReports = async () => {
    setLoading(true);
    setError(null);
    setSelectedAttendanceIds(new Set());

    let fromDate: string;
    let toDate: string;

    if (selectedMonth === "all") {
      const yearDate = new Date(parseInt(selectedYear), 0, 1); // January 1st of selected year
      fromDate = format(startOfYear(yearDate), 'yyyy-MM-dd');
      toDate = format(endOfYear(yearDate), 'yyyy-MM-dd');
    } else {
      const dateForMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      fromDate = format(startOfMonth(dateForMonth), 'yyyy-MM-dd');
      toDate = format(endOfMonth(dateForMonth), 'yyyy-MM-dd');
    }

    let query = supabase
      .from('attendance')
      .select(`
        id,
        date,
        period,
        status,
        student_id,
        students (
          name,
          rollno,
          year
        )
      `)
      .gte('date', fromDate)
      .lte('date', toDate);

    if (selectedStudentId !== "all") {
      query = query.eq('student_id', selectedStudentId);
    } else {
      if (searchTerm) {
        query = query.or(`students.name.ilike.%${searchTerm}%,students.rollno.ilike.%${searchTerm}%`);
      }
      if (filterSemester !== "all") {
        query = query.eq('students.year', parseInt(filterSemester));
      }
    }

    const { data, error } = await query
      .order('date', { ascending: false })
      .order('period', { ascending: true });

    if (error) {
      console.error("Error fetching attendance data:", error);
      setError("Failed to load attendance reports.");
      showError("Failed to load attendance reports.");
    } else {
      setAttendanceData(data as AttendanceRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendanceReports();
  }, [selectedMonth, selectedYear, searchTerm, filterSemester, selectedStudentId]);

  const studentSummaries: StudentAttendanceSummary[] = useMemo(() => {
    const summaryMap = new Map<string, Omit<StudentAttendanceSummary, 'percentage'>>();

    attendanceData.forEach(record => {
      const studentId = record.student_id;
      const studentInfo = (record as any).students;

      if (!studentInfo) return;

      if (!summaryMap.has(studentId)) {
        summaryMap.set(studentId, {
          student_id: studentId,
          student_name: studentInfo.name || 'N/A',
          rollno: studentInfo.rollno || 'N/A',
          semester: studentInfo.year || 0,
          total_periods: 0,
          present_count: 0,
          absent_count: 0,
          late_count: 0,
        });
      }

      const summary = summaryMap.get(studentId)!;
      summary.total_periods++;
      if (record.status === 'present') {
        summary.present_count++;
      } else if (record.status === 'absent') {
        summary.absent_count++;
      } else if (record.status === 'late') {
        summary.late_count++;
      }
    });

    return Array.from(summaryMap.values()).map(summary => {
      const percentage = summary.total_periods > 0
        ? ((summary.present_count + summary.late_count) / summary.total_periods * 100).toFixed(2)
        : "0.00";
      return { ...summary, percentage: `${percentage}%` };
    });
  }, [attendanceData]);

  const detailedDailyAttendance: DailyAttendance[] = useMemo(() => {
    if (selectedStudentId === "all" || !attendanceData.length) return [];

    const dailyMap = new Map<string, DailyAttendance>();

    attendanceData.forEach(record => {
      const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
      const studentInfo = (record as any).students;

      if (!studentInfo) return;

      const uniqueRecordKey = `${dateKey}_${record.id}`;

      if (!dailyMap.has(uniqueRecordKey)) {
        dailyMap.set(uniqueRecordKey, {
          id: record.id!,
          date: format(new Date(record.date), 'PPP'),
          rollno: studentInfo.rollno || 'N/A',
          name: studentInfo.name || 'N/A',
          periods: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
        });
      }

      const dailyRecord = dailyMap.get(uniqueRecordKey)!;
      dailyRecord.periods[record.period] = record.status === 'present' || record.status === 'late' ? 'P' : 'A';
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceData, selectedStudentId]);

  const handleExport = () => {
    if (studentSummaries.length === 0) {
      showError("No data to export.");
      return;
    }

    const monthName = selectedMonth === "all" ? "All_Months" : months.find(m => m.value === selectedMonth)?.label;
    const filename = `attendance_report_${monthName}_${selectedYear}`;

    const headers = [
      { key: 'student_name', label: 'Student Name' },
      { key: 'rollno', label: 'Roll No.' },
      { key: 'semester', label: 'Semester' },
      { key: 'total_periods', label: 'Total Periods' },
      { key: 'present_count', label: 'Present' },
      { key: 'absent_count', label: 'Absent' },
      { key: 'late_count', label: 'Late' },
      { key: 'percentage', label: 'Attendance Percentage' },
    ];

    exportToCsv(studentSummaries, filename, headers);
    showSuccess("Attendance report exported successfully!");
  };

  const handleSelectRecord = (id: string, checked: boolean) => {
    setSelectedAttendanceIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAllRecords = (checked: boolean) => {
    setSelectedAttendanceIds(prev => {
      const newSet = new Set<string>();
      if (checked) {
        attendanceData.forEach(record => {
          if (record.id) newSet.add(record.id);
        });
      }
      return newSet;
    });
  };

  const handleDeleteSingleRecord = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('attendance').delete().eq('id', id);

    if (error) {
      console.error("Error deleting attendance record:", error);
      showError("Failed to delete attendance record.");
    } else {
      showSuccess("Attendance record deleted successfully!");
      fetchAttendanceReports();
    }
    setLoading(false);
  };

  const handleBulkDeleteRecords = async () => {
    if (selectedAttendanceIds.size === 0) {
      showError("No records selected for deletion.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('attendance').delete().in('id', Array.from(selectedAttendanceIds));

    if (error) {
      console.error("Error deleting attendance records:", error);
      showError("Failed to delete selected attendance records.");
    } else {
      showSuccess(`${selectedAttendanceIds.size} attendance records deleted successfully!`);
      setSelectedAttendanceIds(new Set());
      fetchAttendanceReports();
    }
    setLoading(false);
  };

  const allRecordsSelected = attendanceData.length > 0 && selectedAttendanceIds.size === attendanceData.length;
  const indeterminateSelection = selectedAttendanceIds.size > 0 && selectedAttendanceIds.size < attendanceData.length;

  return (
    <div className="px-0 py-6">
      <h1 className="text-3xl font-bold mb-6 text-deep-blue px-4">Attendance Reports</h1>
      <p className="text-lg text-gray-700 mb-6 px-4">
        View and analyze student attendance records.
      </p>

      <Card className="mb-6 rounded-none sm:rounded-lg mx-4 sm:mx-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-deep-blue">Filter Options</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4 px-4 sm:px-6">
          <Select onValueChange={setSelectedMonth} value={selectedMonth}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setSelectedYear} value={selectedYear}>
            <SelectTrigger className="w-full md:w-[100px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value: "all" | string) => {
            setFilterSemester(value);
            setSelectedStudentId("all");
          }} defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value="1">1st Semester</SelectItem>
              <SelectItem value="2">2nd Semester</SelectItem>
              <SelectItem value="3">3rd Semester</SelectItem>
              <SelectItem value="4">4th Semester</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value: string | "all") => setSelectedStudentId(value)} value={selectedStudentId}>
            <SelectTrigger className="w-full md:w-[200px]" disabled={loading || (filterSemester !== "all" && studentsListForSelector.length === 0)}>
              <SelectValue placeholder="Select Student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students (Summary)</SelectItem>
              {studentsListForSelector.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {student.rollno} - {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStudentId === "all" && (
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
                disabled={selectedStudentId !== "all"}
              />
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={loading || studentSummaries.length === 0}
            className="w-full md:w-auto bg-app-green text-white hover:bg-app-green/90"
          >
            <Download className="mr-2 h-4 w-4" /> Export to CSV
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4 px-4 sm:px-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 text-lg px-4 sm:px-6">{error}</div>
      ) : (
        <>
          {selectedStudentId !== "all" && (
            <div className="px-4 sm:px-6 mb-6">
              <Card key={`detailed-${filterSemester}-${selectedStudentId}-${selectedMonth}-${selectedYear}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-deep-blue">Detailed Attendance for {studentsListForSelector.find(s => s.id === selectedStudentId)?.name || 'Selected Student'}</CardTitle>
                    {isAdmin && detailedDailyAttendance.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={selectedAttendanceIds.size === 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedAttendanceIds.size})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {selectedAttendanceIds.size} selected attendance records? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDeleteRecords}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {detailedDailyAttendance.length === 0 ? (
                    <p className="text-center text-gray-600">No detailed attendance records found for the selected student and month.</p>
                  ) : (
                    <div className="rounded-md border bg-white p-4 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {isAdmin && (
                              <TableHead className="w-[50px]">
                                <Checkbox
                                  checked={allRecordsSelected}
                                  indeterminate={indeterminateSelection}
                                  onCheckedChange={(checked) => handleSelectAllRecords(!!checked)}
                                  aria-label="Select all"
                                />
                              </TableHead>
                            )}
                            <TableHead className="min-w-[120px]">Date</TableHead>
                            {Array.from({ length: 6 }, (_, i) => i + 1).map(period => (
                              <TableHead key={period} className="text-center min-w-[80px]">Period {period}</TableHead>
                            ))}
                            {isAdmin && <TableHead className="text-right min-w-[80px]">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailedDailyAttendance.map((dailyRecord) => (
                            <TableRow key={dailyRecord.id}>
                              {isAdmin && (
                                <TableCell>
                                  <Checkbox
                                    checked={selectedAttendanceIds.has(dailyRecord.id)}
                                    onCheckedChange={(checked) => handleSelectRecord(dailyRecord.id, !!checked)}
                                    aria-label={`Select record for ${dailyRecord.name} on ${dailyRecord.date}`}
                                  />
                                </TableCell>
                              )}
                              <TableCell className="font-medium">{dailyRecord.date}</TableCell>
                              {Array.from({ length: 6 }, (_, i) => i + 1).map(period => (
                                <TableCell key={period} className="text-center">
                                  <Badge
                                    variant={
                                      dailyRecord.periods[period] === 'P'
                                        ? "default"
                                        : dailyRecord.periods[period] === 'A'
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className={cn(
                                      "w-8 h-8 flex items-center justify-center mx-auto",
                                      dailyRecord.periods[period] === '' && "bg-gray-200 text-gray-600"
                                    )}
                                  >
                                    {dailyRecord.periods[period] || '-'}
                                  </Badge>
                                </TableCell>
                              ))}
                              {isAdmin && (
                                <TableCell className="text-right">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete record</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the attendance record for {dailyRecord.name} on {dailyRecord.date} (Period {Object.keys(dailyRecord.periods).find(p => dailyRecord.periods[parseInt(p)] !== '') || 'N/A'}).
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteSingleRecord(dailyRecord.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="px-4 sm:px-6">
            <AttendanceReportTable key={`summary-${filterSemester}-${selectedStudentId}-${selectedMonth}-${selectedYear}`} summaries={studentSummaries} />
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceReports;