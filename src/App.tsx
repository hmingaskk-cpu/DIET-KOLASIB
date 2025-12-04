import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layouts/DashboardLayout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Courses from "./pages/Courses";
import Students from "./pages/Students";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import FacultyPage from "./pages/Faculty";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Unauthorized from "./pages/Unauthorized";
import UserManagement from "./pages/UserManagement";
import StudentDetail from "./pages/StudentDetail";
import FacultyDetail from "./pages/FacultyDetail";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import AttendanceReports from "./pages/AttendanceReports";
import Resources from "./pages/Resources";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AlumniPage from "./pages/Alumni";
import AlumniDetail from "./pages/AlumniDetail";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading application...</p>
      </div>
    );
  }

  // FIX: This is now a safe component that won't crash if user is null
  const DashboardSelector = () => {
    if (!user) return null;

    console.log("DashboardSelector: Routing for role:", user.role);

    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "faculty":
        return <FacultyDashboard />;
      case "staff":
        return <StaffDashboard />;
      case "student":
        return <StudentDashboard />;
      default:
        // FIX: Default to Student or a safe page, NEVER Admin
        console.warn("Unknown role detected, defaulting to Student Dashboard");
        return <StudentDashboard />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* <Route path="/signup" element={<Signup />} /> */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route element={<DashboardLayout />}>
        {/* FIX: DashboardSelector is rendered safely inside the protection */}
        <Route path="/" element={
          <ProtectedRoute requiredRoles={["admin", "faculty", "staff", "student"]}>
            <DashboardSelector />
          </ProtectedRoute>
        } />
        
        <Route path="/about" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff", "student"]}><About /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff", "student"]}><Contact /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff"]}><Courses /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff"]}><Students /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff", "student"]}><StudentDetail /></ProtectedRoute>} />
        <Route path="/faculty" element={<ProtectedRoute requiredRoles={["admin", "staff"]}><FacultyPage /></ProtectedRoute>} />
        <Route path="/faculty/:id" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff"]}><FacultyDetail /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff"]}><Attendance /></ProtectedRoute>} />
        <Route path="/attendance-reports" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff"]}><AttendanceReports /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff", "student"]}><Resources /></ProtectedRoute>} />
        <Route path="/alumni" element={<ProtectedRoute requiredRoles={["admin", "staff"]}><AlumniPage /></ProtectedRoute>} />
        <Route path="/alumni/:id" element={<ProtectedRoute requiredRoles={["admin", "staff", "faculty", "student"]}><AlumniDetail /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff", "student"]}><Calendar /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff", "student"]}><Settings /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff"]}><Reports /></ProtectedRoute>} />
        <Route path="/user-management" element={<ProtectedRoute requiredRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requiredRoles={["admin", "faculty", "staff", "student"]}><Profile /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;