"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditDialogProps {
  title: string;
  children: React.ReactNode; // The edit form component will be passed as children
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditDialog = ({ title, children, isOpen, onOpenChange }: EditDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default EditDialog;