"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  date: string; // Formatted date, e.g., "Jan 01"
  absences: number;
}

interface AbsenceTrendChartProps {
  data: ChartData[];
}

const AbsenceTrendChart = ({ data }: AbsenceTrendChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-deep-blue">Absence Trend Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="absences" stroke="#EF4444" activeDot={{ r: 8 }} /> {/* Using destructive color */}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AbsenceTrendChart;