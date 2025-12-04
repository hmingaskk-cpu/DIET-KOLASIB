"use client";

import React from "react";
import { CalendarEvent } from "./CalendarEventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import Button
import { Edit, Trash2 } from "lucide-react"; // Import Edit and Trash2 icons
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Import AlertDialog

interface EventListProps {
  events: CalendarEvent[];
  selectedDate: Date | undefined;
  onEdit: (event: CalendarEvent) => void; // New prop for edit action
  onDelete: (id: string) => void; // New prop for delete action
  isAdminOrStaff: boolean; // New prop to control visibility of edit/delete buttons
}

const EventList = ({ events, selectedDate, onEdit, onDelete, isAdminOrStaff }: EventListProps) => {
  const filteredEvents = events.filter(event => 
    selectedDate && format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-deep-blue">
        Events for {selectedDate ? format(selectedDate, "PPP") : "Selected Date"}
      </h2>
      {filteredEvents.length > 0 ? (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{event.title}</CardTitle>
                {isAdminOrStaff && ( // Conditionally render action buttons
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(event)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <span>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event "{event.title}" from the database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(event.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{event.description || "No description provided."}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Date: {format(event.date, "PPP")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No events scheduled for this date.</p>
      )}
    </div>
  );
};

export default EventList;