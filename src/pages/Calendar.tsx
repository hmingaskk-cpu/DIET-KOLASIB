"use client";

import React, { useState, useEffect } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarEventForm, { CalendarEvent } from "@/components/CalendarEventForm";
import EditCalendarEventForm from "@/components/EditCalendarEventForm";
import EventList from "@/components/EventList";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import AddDialog from "@/components/AddDialog";
import EditDialog from "@/components/EditDialog";
import { supabase } from "@/lib/supabase"; // Import Supabase client
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const Calendar = () => {
  const { user, session, loading: authLoading } = useAuth(); // Get the current user and session from AuthContext
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff" || user?.role === "faculty"; // Added 'faculty' role

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('calendarEvents').select('*');

    if (error) {
      console.error("Error fetching calendar events:", error);
      setError("Failed to load calendar events.");
      showError("Failed to load calendar events.");
    } else {
      // Ensure dates are Date objects
      const fetchedEvents = data.map(event => ({
        ...event,
        date: new Date(event.date),
      })) as CalendarEvent[];
      setEvents(fetchedEvents);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (newEventData: Omit<CalendarEvent, 'id'>) => {
    console.log("Calendar.tsx: handleAddEvent called.");
    console.log("Calendar.tsx: Current user from AuthContext:", user);
    console.log("Calendar.tsx: Current session from AuthContext:", session);
    console.log("Calendar.tsx: isAdminOrStaff check:", isAdminOrStaff);

    if (!isAdminOrStaff) {
      showError("You do not have permission to add events.");
      console.warn("Calendar.tsx: User attempted to add event without sufficient role.");
      return;
    }

    // Double-check Supabase client's internal session state
    const { data: supabaseUserSession, error: sessionError } = await supabase.auth.getSession();
    console.log("Calendar.tsx: Supabase client's internal session data:", supabaseUserSession);
    if (sessionError) {
      console.error("Calendar.tsx: Error getting Supabase client's internal session:", sessionError);
      showError("Authentication error: Could not verify session.");
      return;
    }
    if (!supabaseUserSession?.session?.access_token) {
      console.error("Calendar.tsx: Supabase client's internal session has no access token. User is likely not authenticated.");
      showError("You are not logged in. Please log in to add events.");
      return;
    }


    const { data, error } = await supabase.from('calendarEvents').insert([{
      title: newEventData.title,
      date: format(newEventData.date, 'yyyy-MM-dd'), // Format date for Supabase
      description: newEventData.description,
    }]).select();

    if (error) {
      console.error("Error adding event:", error);
      showError(`Failed to add event: ${error.message}`); // Added error.message for detail
    } else if (data && data.length > 0) {
      const addedEvent = { ...data[0], date: new Date(data[0].date) } as CalendarEvent;
      setEvents((prevEvents) => [...prevEvents, addedEvent]);
      showSuccess("Event added successfully!");
      setIsAddFormOpen(false);
    }
  };

  const handleEditEvent = async (event: CalendarEvent) => {
    console.log("Calendar.tsx: handleEditEvent called.");
    console.log("Calendar.tsx: Current user from AuthContext:", user);
    console.log("Calendar.tsx: Current session from AuthContext:", session);
    console.log("Calendar.tsx: isAdminOrStaff check:", isAdminOrStaff);

    if (!isAdminOrStaff) {
      showError("You do not have permission to edit events.");
      console.warn("Calendar.tsx: User attempted to edit event without sufficient role.");
      return;
    }
    setEditingEvent(event);
    setIsEditFormOpen(true);
  };

  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    console.log("Calendar.tsx: handleUpdateEvent called.");
    console.log("Calendar.tsx: Current user from AuthContext:", user);
    console.log("Calendar.tsx: Current session from AuthContext:", session);
    console.log("Calendar.tsx: isAdminOrStaff check:", isAdminOrStaff);

    if (!isAdminOrStaff) {
      showError("You do not have permission to update events.");
      console.warn("Calendar.tsx: User attempted to update event without sufficient role.");
      return;
    }
    const { data, error } = await supabase.from('calendarEvents').update({
      title: updatedEvent.title,
      date: format(updatedEvent.date, 'yyyy-MM-dd'), // Format date for Supabase
      description: updatedEvent.description,
    }).eq('id', updatedEvent.id).select();

    if (error) {
      console.error("Error updating event:", error);
      showError("Failed to update event.");
    } else if (data && data.length > 0) {
      const updatedEventWithDate = { ...data[0], date: new Date(data[0].date) } as CalendarEvent;
      setEvents((prevEvents) =>
        prevEvents.map((e) => (e.id === updatedEvent.id ? updatedEventWithDate : e))
      );
      showSuccess("Event updated successfully!");
      setIsEditFormOpen(false);
      setEditingEvent(null);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    console.log("Calendar.tsx: handleDeleteEvent called.");
    console.log("Calendar.tsx: Current user from AuthContext:", user);
    console.log("Calendar.tsx: Current session from AuthContext:", session);
    console.log("Calendar.tsx: isAdminOrStaff check:", isAdminOrStaff);

    if (!isAdminOrStaff) {
      showError("You do not have permission to delete events.");
      console.warn("Calendar.tsx: User attempted to delete event without sufficient role.");
      return;
    }
    const { error } = await supabase.from('calendarEvents').delete().eq('id', id);

    if (error) {
      console.error("Error deleting event:", error);
      showError("Failed to delete event.");
    } else {
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== id));
      showSuccess("Event deleted successfully!");
    }
  };

  // Create a set of dates that have events for the calendar modifier
  const eventDates = events.map(event => event.date);
  const modifiers = {
    hasEvent: eventDates,
  };

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">Academic Calendar</h1>
        {isAdminOrStaff && (
          <AddDialog
            title="Add New Event"
            triggerButtonText="Add New Event"
            isOpen={isAddFormOpen}
            onOpenChange={setIsAddFormOpen}
          >
            <CalendarEventForm onSuccess={handleAddEvent} />
          </AddDialog>
        )}
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        View and manage important academic dates and events.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-6">
        <Card className="w-full rounded-none sm:rounded-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-center text-deep-blue">Select a Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center px-4 sm:px-6">
            {loading ? (
              <Skeleton className="h-[300px] w-[300px] rounded-md" />
            ) : error ? (
              <div className="text-center text-red-500 text-lg">{error}</div>
            ) : (
              <ShadcnCalendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={modifiers}
                modifiersClassNames={{
                  hasEvent: "bg-app-green text-white rounded-full", // Apply Tailwind classes for styling
                }}
              />
            )}
          </CardContent>
        </Card>
        <div className="w-full">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 text-lg">{error}</div>
          ) : (
            <EventList
              events={events}
              selectedDate={selectedDate}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              isAdminOrStaff={isAdminOrStaff} // Pass down the prop
            />
          )}
        </div>
      </div>

      {editingEvent && (
        <EditDialog
          title="Edit Event"
          isOpen={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
        >
          <EditCalendarEventForm event={editingEvent} onSuccess={handleUpdateEvent} />
        </EditDialog>
      )}
    </div>
  );
};

export default Calendar;