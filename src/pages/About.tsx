"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  return (
    <div className="px-0 py-6 flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold mb-4 text-deep-blue px-4">About DIET KOLASIB</h1>
      <p className="text-xl text-gray-700 mb-6 max-w-2xl px-4">
        The District Institute of Education and Training (DIET) Kolasib is dedicated to fostering excellence in elementary education and teacher training.
      </p>
      <Card className="max-w-3xl w-full text-left rounded-none sm:rounded-lg">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-deep-blue">Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <p className="text-gray-800 mb-4">
            Our mission is to provide high-quality pre-service and in-service training to elementary school teachers, equip them with innovative pedagogical skills, and conduct research to improve the quality of education in the Kolasib district. We aim to empower educators to inspire and guide the next generation.
          </p>
          <CardTitle className="text-deep-blue mt-6">Our Vision</CardTitle>
          <p className="text-gray-800">
            To be a leading institution in teacher education, promoting holistic development, critical thinking, and a commitment to lifelong learning among teachers and students alike. We envision a future where every child in Kolasib receives quality education from well-trained and motivated teachers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;