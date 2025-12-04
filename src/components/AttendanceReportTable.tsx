"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  rollno: string; // Changed to 'rollno'
  // Removed 'course'
  semester: number;
  total_periods: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  percentage: string;
}

interface AttendanceReportTableProps {
  summaries: StudentAttendanceSummary[];
}

const AttendanceReportTable = ({ summaries }: AttendanceReportTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-deep-blue">Student Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <p className="text-center text-gray-600">No attendance data available for the selected filters.</p>
        ) : (
          <div className="rounded-md border bg-white p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No.</TableHead>
                  {/* Removed Course column */}
                  <TableHead>Semester</TableHead>
                  <TableHead>Total Periods</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((summary) => (
                  <TableRow key={summary.student_id}>
                    <TableCell className="font-medium">{summary.student_name}</TableCell>
                    <TableCell>{summary.rollno}</TableCell> {/* Changed to 'rollno' */}
                    {/* Removed Course cell */}
                    <TableCell>{summary.semester}</TableCell>
                    <TableCell>{summary.total_periods}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-app-green hover:bg-app-green/90">
                        {summary.present_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {summary.absent_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {summary.late_count}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      parseFloat(summary.percentage) >= 75 ? "text-app-green" : "text-destructive"
                    )}>
                      {summary.percentage}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceReportTable;