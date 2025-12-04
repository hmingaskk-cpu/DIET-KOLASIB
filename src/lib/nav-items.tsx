import { Home, BookOpen, Users, Calendar, Settings, UserSquare, BarChart2, Info, Mail, UserCog, User as UserIcon, ClipboardCheck, FileText, FolderOpen, GraduationCap } from "lucide-react";

export const navItems = [
  // The dashboard path will be handled dynamically in App.tsx based on user role
  { name: "Dashboard", icon: Home, path: "/", roles: ["admin", "faculty", "staff", "student"] },
  { name: "Courses", icon: BookOpen, path: "/courses", roles: ["admin", "faculty", "staff"] },
  { name: "Students", icon: Users, path: "/students", roles: ["admin", "faculty", "staff"] },
  { name: "Faculty", icon: UserSquare, path: "/faculty", roles: ["admin", "staff"] },
  { name: "Attendance", icon: ClipboardCheck, path: "/attendance", roles: ["admin", "faculty", "staff"] },
  { name: "Attendance Reports", icon: FileText, path: "/attendance-reports", roles: ["admin", "faculty", "staff"] },
  { name: "Resources", icon: FolderOpen, path: "/resources", roles: ["admin"] },
  { name: "Alumni", icon: GraduationCap, path: "/alumni", roles: ["admin", "staff"] },
  { name: "Calendar", icon: Calendar, path: "/calendar", roles: ["admin", "faculty", "staff", "student"] },
  { name: "Reports", icon: BarChart2, path: "/reports", roles: ["admin", "faculty", "staff"] },
  { name: "User Management", icon: UserCog, path: "/user-management", roles: ["admin"] },
  { name: "Profile", icon: UserIcon, path: "/profile", roles: ["admin", "faculty", "staff", "student"] },
  { name: "About", icon: Info, path: "/about", roles: ["admin", "faculty", "staff", "student"] },
  { name: "Contact", icon: Mail, path: "/contact", roles: ["admin", "faculty", "staff", "student"] },
  { name: "Settings", icon: Settings, path: "/settings", roles: ["admin", "faculty", "staff", "student"] },
];