"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  name: string; // Graduation Year
  alumni: number;
}

interface AlumniByGraduationYearChartProps {
  data: ChartData[];
}

const AlumniByGraduationYearChart = ({ data }: AlumniByGraduationYearChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-deep-blue">Alumni by Graduation Year</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="alumni" fill="#F59E0B" /> {/* Using amber color */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlumniByGraduationYearChart;