"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Edit, Trash2 } from "lucide-react"; // Import Trash2
import AddDialog from "@/components/AddDialog";
import EditDialog from "@/components/EditDialog"; // Import EditDialog
import AddUserForm from "@/components/AddUserForm";
import EditUserForm, { FullUserDetails } from "@/components/EditUserForm"; // Import EditUserForm and FullUserDetails
// Removed FormControl import as it's no longer needed here
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"; // Import AlertDialog

// Extend Supabase's User type to include a role
interface UserWithRole extends User {
  role?: "admin" | "faculty" | "staff" | "student";
}

export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "faculty" | "staff" | "student";
  name?: string; // Changed from first_name and last_name
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | UserProfile['role']>("all");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false); // New state for edit dialog
  const [editingUser, setEditingUser] = useState<FullUserDetails | null>(null); // New state for user being edited
  const [isUpdatingUser, setIsUpdatingUser] = useState(false); // New state for update loading

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, name'); // Fetch 'name'

      if (profilesError) {
        console.error("Supabase Error: Failed to fetch profiles:", profilesError);
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }
      // Ensure data is an array, even if null is returned
      const validProfilesData = profilesData || [];

      // 2. Fetch all students (to get their specific names if different from profile name)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('user_id, name');

      if (studentsError) {
        console.error("Supabase Error: Failed to fetch students:", studentsError);
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }
      const studentNamesMap = new Map<string, string>();
      (studentsData || []).forEach(s => {
        if (s.user_id && s.name) {
          studentNamesMap.set(s.user_id, s.name);
        }
      });

      // 3. Fetch all faculty (to get their specific names if different from profile name)
      const { data: facultyData, error: facultyError } = await supabase
        .from('faculty')
        .select('user_id, name');

      if (facultyError) {
        console.error("Supabase Error: Failed to fetch faculty:", facultyError);
        throw new Error(`Failed to fetch faculty: ${facultyError.message}`);
      }
      const facultyNamesMap = new Map<string, string>();
      (facultyData || []).forEach(f => {
        if (f.user_id && f.name) {
          facultyNamesMap.set(f.user_id, f.name);
        }
      });

      // 4. Combine profiles with specific names
      const combinedUsers: UserProfile[] = validProfilesData.map(profile => {
        const specificName = studentNamesMap.get(profile.id) || facultyNamesMap.get(profile.id);
        return {
          id: profile.id,
          email: profile.email || 'N/A',
          role: profile.role || 'student',
          name: specificName || profile.name || undefined, // Prioritize specific table name, then profile name
        };
      });

      setUsers(combinedUsers);
    } catch (err: any) {
      console.error("UserManagement: Overall data fetching error:", err);
      setError(`Failed to load user profiles: ${err.message}`);
      showError(`Failed to load user profiles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error("Error updating user role:", error);
      showError("Failed to update user role.");
    } else {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      showSuccess("User role updated successfully!");
    }
  };

  const handleAddUser = async (email: string, role: UserProfile['role'], temporaryPassword: string, name: string, studentDetails?: any, facultyDetails?: any): Promise<string | undefined> => {
    setIsCreatingUser(true);
    console.log("UserManagement: handleAddUser called with:", { email, role, temporaryPassword, name, studentDetails, facultyDetails });
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password: temporaryPassword, role, name, studentDetails, facultyDetails },
      });

      console.log("UserManagement: Supabase invoke response:", { data, error });

      if (error) {
        console.error("Error invoking create-user edge function:", error);
        showError(`Failed to create user: ${error.message}`);
        return undefined;
      } else if (data && data.user) {
        showSuccess(`User ${email} created successfully with role ${role}!`);
        fetchUsers();
        return temporaryPassword;
      } else {
        showError("Failed to create user: Unknown response from server.");
        return undefined;
      }
    } catch (err: any) {
      console.error("Network or unexpected error calling Edge Function:", err);
      showError(`Failed to create user: ${err.message || 'Network error'}`);
      return undefined;
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = async (userProfile: UserProfile) => {
    setLoading(true); // Show loading while fetching full details
    setError(null);
    try {
      let studentData = null;
      let facultyData = null;

      if (userProfile.role === "student") {
        const { data, error } = await supabase.from('students').select('*').eq('user_id', userProfile.id).single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"
        studentData = data;
      } else if (userProfile.role === "faculty") {
        const { data, error } = await supabase.from('faculty').select('*').eq('user_id', userProfile.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        facultyData = data;
      }

      setEditingUser({
        profile: userProfile,
        student: studentData || undefined,
        faculty: facultyData || undefined,
      });
      setIsEditUserDialogOpen(true);
    } catch (err: any) {
      console.error("Error fetching user details for edit:", err);
      showError(`Failed to load user details for editing: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, role: string, newPassword?: string, name?: string, studentDetails?: any, facultyDetails?: any) => {
    setIsUpdatingUser(true);
    console.log("UserManagement: handleUpdateUser called with:", { userId, role, newPassword, name, studentDetails, facultyDetails });
    try {
      // 1. Handle password update if newPassword is provided
      if (newPassword) {
        const { data: passwordUpdateData, error: passwordUpdateError } = await supabase.functions.invoke('update-user', {
          body: { userId, password: newPassword, updatePasswordOnly: true }, // Indicate only password update
        });

        if (passwordUpdateError) {
          console.error("Error invoking update-user edge function for password:", passwordUpdateError);
          showError(`Failed to update password: ${passwordUpdateError.message}`);
          setIsUpdatingUser(false);
          return; // Stop if password update fails
        } else if (passwordUpdateData && passwordUpdateData.message) {
          showSuccess("User password updated successfully!");
        }
      }

      // 2. Handle role and profile details update
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: { userId, role, name, studentDetails, facultyDetails },
      });

      console.log("UserManagement: Supabase invoke update response:", { data, error });

      if (error) {
        console.error("Error invoking update-user edge function for profile details:", error);
        showError(`Failed to update user profile details: ${error.message}`);
      } else {
        showSuccess(`User ${userId} updated successfully with role ${role}!`);
        fetchUsers(); // Refresh the user list
        setIsEditUserDialogOpen(false); // Close the dialog
        setEditingUser(null); // Clear editing user state
      }
    } catch (err: any) {
      console.error("Network or unexpected error calling Edge Function:", err);
      showError(`Failed to update user: ${err.message || 'Network error'}`);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    setLoading(true); // Show loading while deleting
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) {
        console.error("Error invoking delete-user edge function:", error);
        showError(`Failed to delete user: ${error.message}`);
      } else if (data && data.message) {
        showSuccess(`User ${userEmail} and all associated data deleted successfully!`);
        fetchUsers(); // Refresh the user list
      } else {
        showError("Failed to delete user: Unknown response from server.");
      }
    } catch (err: any) {
      console.error("Network or unexpected error calling Edge Function for delete:", err);
      showError(`Failed to delete user: ${err.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchTarget = `${user.name || ''} ${user.email}`.toLowerCase(); // Search by single name field
      const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "all" || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  return (
    <div className="px-0 py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-3xl font-bold text-deep-blue">User Management</h1>
        <AddDialog
          title="Add New User"
          triggerButtonText="Add New User"
          isOpen={isAddUserDialogOpen}
          onOpenChange={setIsAddUserDialogOpen}
        >
          <AddUserForm onSuccess={handleAddUser} isLoading={isCreatingUser} />
        </AddDialog>
      </div>
      <p className="text-lg text-gray-700 mb-6 px-4">
        Manage user roles and access permissions.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6 px-4 sm:px-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value: "all" | UserProfile['role']) => setFilterRole(value)} defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-none sm:rounded-lg mx-4 sm:mx-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-deep-blue">All Users</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 text-lg">{error}</div>
          ) : (
            <div className="rounded-md border bg-white p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || user.email}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="text-right flex items-center justify-end space-x-2">
                        <Select onValueChange={(value: UserProfile['role']) => handleRoleChange(user.id, value)} defaultValue={user.role}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Change Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={isUpdatingUser}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                            >
                              <span>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete User</span>
                              </span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user "{user.email}" and all their associated data (profile, student details, faculty details) from the database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.email)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <EditDialog
          title={`Edit User: ${editingUser.profile.email}`}
          isOpen={isEditUserDialogOpen}
          onOpenChange={setIsEditUserDialogOpen}
        >
          <EditUserForm
            initialData={editingUser}
            onSuccess={handleUpdateUser}
            isLoading={isUpdatingUser}
          />
        </EditDialog>
      )}
    </div>
  );
};

export default UserManagement;