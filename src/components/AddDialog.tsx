"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

interface AddDialogProps {
  title: string;
  triggerButtonText: string;
  children: React.ReactNode; // The form component will be passed as children
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddDialog = ({ title, triggerButtonText, children, isOpen, onOpenChange }: AddDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-app-green text-white hover:bg-app-green/90">
          {/* Wrap icon and text in a single span to ensure a single child */}
          <span>
            <PlusCircle className="mr-2 h-4 w-4" /> {triggerButtonText}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {`Please fill in the details to ${title.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default AddDialog;