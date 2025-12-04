"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabase";
import { Student } from "./StudentTable";
import { useAuth } from "@/context/AuthContext";

export interface AttendanceRecord {
  id?: string;
  date: string;
  period: number;
  student_id: string;
  status: 'present' | 'absent' | 'late';
  faculty_abbreviation?: string;
  created_at?: string;
}

const attendanceFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  period: z.string().min(1, { message: "Please select a period." }).transform(Number),
  semester: z.string().min(1, { message: "Please select a semester." }).transform(Number),
});

const AttendanceForm = () => {
  const { user } = useAuth();
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<Map<string, boolean>>(new Map());
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingTakenPeriods, setLoadingTakenPeriods] = useState(false);
  const [loadingAttendanceForPeriod, setLoadingAttendanceForPeriod] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFacultyAbbreviation, setCurrentFacultyAbbreviation] = useState<string | null>(null);
  const [takenPeriods, setTakenPeriods] = useState<Map<number, string>>(new Map());
  const [isEditingExistingAttendance, setIsEditingExistingAttendance] = useState(false);

  const form = useForm<z.infer<typeof attendanceFormSchema>>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      date: new Date(),
      period: "",
      semester: "",
    },
  });

  const selectedDate = form.watch("date");
  const selectedSemester = form.watch("semester");
  const selectedPeriod = form.watch("period");

  useEffect(() => {
    const fetchFacultyAbbreviation = async () => {
      if (user?.role === "faculty" && user.id) {
        const { data, error } = await supabase.from('faculty').select('abbreviation').eq('user_id', user.id).single();
        if (error || !data) {
          showError("Failed to load your faculty abbreviation.");
          setCurrentFacultyAbbreviation(null);
        } else {
          setCurrentFacultyAbbreviation(data.abbreviation);
        }
      }
    };
    fetchFacultyAbbreviation();
  }, [user]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedSemester) {
        setStudentsInClass([]);
        return;
      }
      setLoadingStudents(true);
      const { data, error } = await supabase.from('students').select('*').eq('year', selectedSemester);
      if (error) {
        showError("Failed to load students.");
        setStudentsInClass([]);
      } else {
        setStudentsInClass(data as Student[]);
      }
      setLoadingStudents(false);
    };
    fetchStudents();
  }, [selectedSemester]);

  useEffect(() => {
    const fetchTakenPeriods = async () => {
      if (!selectedDate) return;
      setLoadingTakenPeriods(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase.from('attendance').select('period, faculty_abbreviation').eq('date', formattedDate);
      if (error) {
        showError("Failed to load taken periods.");
        setTakenPeriods(new Map());
      } else {
        const map = new Map<number, string>();
        data?.forEach(r => map.set(r.period, r.faculty_abbreviation));
        setTakenPeriods(map);
      }
      setLoadingTakenPeriods(false);
    };
    fetchTakenPeriods();
  }, [selectedDate]);

  useEffect(() => {
    const populateAttendance = async () => {
      if (!selectedDate || !selectedSemester || !selectedPeriod || !currentFacultyAbbreviation || studentsInClass.length === 0 || loadingTakenPeriods) return;

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const selectedPeriodNumber = Number(selectedPeriod);
      const takenBy = takenPeriods.get(selectedPeriodNumber)?.trim().toLowerCase();
      const facultyCode = currentFacultyAbbreviation?.trim().toLowerCase();
      const isOwnPeriod = takenBy === facultyCode;

      if (isOwnPeriod) {
        setIsEditingExistingAttendance(true);
        setLoadingAttendanceForPeriod(true);

        const { data, error } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('date', formattedDate)
          .eq('period', selectedPeriodNumber)
          .in('student_id', studentsInClass.map(s => s.id));

        if (!error && data) {
          const existingStatus = new Map<string, boolean>();
          studentsInClass.forEach(student => {
            const record = data.find(r => r.student_id === student.id);
            existingStatus.set(student.id, record?.status === 'present' || record?.status === 'late');
          });
          setAttendanceStatus(existingStatus);
        } else {
          showError("Failed to load existing attendance.");
        }
        setLoadingAttendanceForPeriod(false);
      } else {
        const defaultAbsentStatus = new Map<string, boolean>();
        studentsInClass.forEach(student => defaultAbsentStatus.set(student.id, false));
        setAttendanceStatus(defaultAbsentStatus);
        setIsEditingExistingAttendance(false);
      }
    };
    populateAttendance();
  }, [selectedDate, selectedSemester, selectedPeriod, currentFacultyAbbreviation, studentsInClass, takenPeriods, loadingTakenPeriods]);

  const handleToggleAttendance = (studentId: string, checked: boolean) => {
    setAttendanceStatus(prev => {
      const m = new Map(prev);
      m.set(studentId, checked);
      return m;
    });
  };

  const handleMarkAll = (isAllPresent: boolean) => {
    const newMap = new Map<string, boolean>();
    studentsInClass.forEach(s => newMap.set(s.id, isAllPresent));
    setAttendanceStatus(newMap);
  };

  const onSubmit = async (values: z.infer<typeof attendanceFormSchema>) => {
    if (!currentFacultyAbbreviation) return showError("Faculty abbreviation not set.");

    const takenBy = takenPeriods.get(values.period)?.trim().toLowerCase();
    const isOwnPeriod = takenBy === currentFacultyAbbreviation?.trim().toLowerCase();

    if (takenPeriods.has(values.period) && !isOwnPeriod) {
      showError(`Period ${values.period} is already taken by ${takenBy}.`);
      return;
    }

    setIsSubmitting(true);
    const formattedDate = format(values.date, 'yyyy-MM-dd');
    const records = Array.from(attendanceStatus.entries()).map(([student_id, isPresent]) => ({
      date: formattedDate,
      period: values.period,
      student_id,
      status: isPresent ? 'present' : 'absent',
      faculty_abbreviation: currentFacultyAbbreviation,
    }));

    const { data: existing, error: checkErr } = await supabase
      .from('attendance')
      .select('id, student_id')
      .eq('date', formattedDate)
      .eq('period', values.period)
      .in('student_id', studentsInClass.map(s => s.id));

    if (checkErr) {
      showError("Failed to check existing records.");
      setIsSubmitting(false);
      return;
    }

    const existingMap = new Map(existing?.map(r => [r.student_id, r.id]));
    let hasError = false;

    for (const r of records) {
      const id = existingMap.get(r.student_id);
      if (id) {
        const { error } = await supabase.from('attendance').update({ status: r.status }).eq('id', id);
        if (error) hasError = true;
      } else {
        const { error } = await supabase.from('attendance').insert(r);
        if (error) hasError = true;
      }
    }

    if (hasError) showError("Some records failed.");
    else showSuccess(isEditingExistingAttendance ? "Attendance updated!" : "Attendance submitted!");

    setTakenPeriods(prev => new Map(prev).set(values.period, currentFacultyAbbreviation!));
    setIsEditingExistingAttendance(true);
    setIsSubmitting(false);
  };

  const isStudentListLoading = loadingStudents || loadingAttendanceForPeriod;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <ShadcnCalendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="semester"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Semester</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1st Semester</SelectItem>
                    <SelectItem value="2">2nd Semester</SelectItem>
                    <SelectItem value="3">3rd Semester</SelectItem>
                    <SelectItem value="4">4th Semester</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""} disabled={loadingTakenPeriods}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((periodNum) => {
                      const isTaken = takenPeriods.has(periodNum);
                      const takenBy = takenPeriods.get(periodNum);
                      const canEdit = isTaken && takenBy?.trim().toLowerCase() === currentFacultyAbbreviation?.trim().toLowerCase();
                      return (
                        <SelectItem
                          key={periodNum}
                          value={periodNum.toString()}
                          disabled={isTaken && !canEdit}
                        >
                          Period {periodNum} {isTaken && `(Taken by ${takenBy})`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-deep-blue">Student List</h3>
          {isStudentListLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-app-green" />
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : studentsInClass.length === 0 ? (
            <p className="text-gray-600">No students found for the selected semester.</p>
          ) : (
            <>
              <div className="flex justify-end space-x-2 mb-4">
                <Button type="button" variant="outline" onClick={() => handleMarkAll(true)} className="border-app-green text-app-green hover:bg-app-green/10">
                  Mark All Present
                </Button>
                <Button type="button" variant="outline" onClick={() => handleMarkAll(false)} className="border-destructive text-destructive hover:bg-destructive/10">
                  Mark All Absent
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {studentsInClass.map(student => {
                  const isPresent = attendanceStatus.get(student.id) ?? false;
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-md bg-light-gray">
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={`attendance-${student.id}`}
                          checked={isPresent}
                          onCheckedChange={(checked) => handleToggleAttendance(student.id, !!checked)}
                        />
                        <span className="text-sm text-gray-800 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                          {student.rollno} - {student.name}
                        </span>
                      </div>
                      <Label htmlFor={`attendance-${student.id}`} className={cn(
                        "text-sm",
                        isPresent ? "text-app-green" : "text-destructive"
                      )}>
                        {isPresent ? "Present" : "Absent"}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <Button type="submit" className="w-full bg-deep-blue text-white hover:bg-deep-blue/90" disabled={isSubmitting || studentsInClass.length === 0 || !currentFacultyAbbreviation || isStudentListLoading || loadingTakenPeriods}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            isEditingExistingAttendance ? "Update Attendance" : "Submit Attendance"
          )}
        </Button>

        {!currentFacultyAbbreviation && user?.role === "faculty" && (
          <p className="text-sm text-red-500 mt-2">
            You cannot submit attendance because your faculty abbreviation is not set. Please update your profile.
          </p>
        )}
      </form>
    </Form>
  );
};

export default AttendanceForm;