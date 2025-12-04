"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  name: string;
  faculty: number;
}

interface FacultyStatusChartProps {
  data: ChartData[];
}

const FacultyStatusChart = ({ data }: FacultyStatusChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-deep-blue">Faculty Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="faculty" fill="#EF4444" /> {/* Using a destructive-like color for faculty */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacultyStatusChart;