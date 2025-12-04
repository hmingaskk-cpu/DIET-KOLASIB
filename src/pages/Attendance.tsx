"use client";

import React from "react";
import AttendanceForm from "@/components/AttendanceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Attendance = () => {
  return (
    <div className="px-0 py-6"> {/* Changed from px-4 py-6 to px-0 py-6 */}
      <h1 className="text-3xl font-bold mb-6 text-deep-blue text-center px-4">Take Attendance</h1>
      <p className="text-lg text-gray-700 mb-6 text-center px-4">
        Mark student attendance for specific periods and classes.
      </p>

      <Card className="max-w-screen-lg mx-auto rounded-none sm:rounded-lg"> {/* Added rounded-none for full edge on mobile */}
        <CardHeader className="px-4 sm:px-6"> {/* Adjusted padding for header inside card */}
          <CardTitle className="text-deep-blue">Attendance Form</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6"> {/* Adjusted padding for content inside card */}
          <AttendanceForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;