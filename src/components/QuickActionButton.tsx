"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
}

const QuickActionButton = ({ to, icon: Icon, title, description, buttonText }: QuickActionButtonProps) => {
  return (
    <Card className="flex flex-col justify-between p-4">
      <div>
        <h3 className="font-medium text-lg text-deep-blue">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <Link to={to} className="mt-3">
        <Button className="w-full bg-app-green text-white hover:bg-app-green/90">
          <Icon className="mr-2 h-4 w-4" /> {buttonText}
        </Button>
      </Link>
    </Card>
  );
};

export default QuickActionButton;