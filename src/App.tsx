import { useEffect, useState } from "react";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Function to completely clean everything
const fullCleanup = () => {
  console.log("Performing full cleanup...");
  
  // 1. Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // 2. Clear all cookies
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // 3. Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
  
  // 4. Clear all caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
  
  // 5. Clear IndexedDB
  if (window.indexedDB) {
    window.indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
    });
  }
  
  console.log("Cleanup complete!");
  window.location.href = '/login?clean=1';
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [showReset, setShowReset] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Log debug info
    const info = `
      Loading: ${loading}
      User: ${user ? `Exists (${user.email})` : 'null'}
      Path: ${window.location.pathname}
      Has localStorage: ${Object.keys(localStorage).length > 0}
      Supabase keys: ${Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-')).join(', ')}
    `;
    setDebugInfo(info);
    console.log('Auth State:', info);

    // Show reset button after 2 seconds if still loading
    const timer = setTimeout(() => {
      if (loading) {
        setShowReset(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [loading, user]);

  // If loading, show simple loading screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium mb-2">Loading application...</p>
        
        {/* Debug info */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm font-mono max-w-lg w-full">
          <p className="font-bold mb-2">Debug Info:</p>
          <pre className="whitespace-pre-wrap">{debugInfo}</pre>
        </div>
        
        {showReset && (
          <div className="mt-6 space-y-3">
            <button
              onClick={fullCleanup}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Full Reset (Clean Everything)
            </button>
            <p className="text-sm text-gray-500 text-center">
              This will clear all data and redirect to login
            </p>
          </div>
        )}
      </div>
    );
  }

  // Dashboard selector
  const DashboardSelector = () => {
    if (!user) {
      return null;
    }

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
        return <StudentDashboard />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route element={<DashboardLayout />}>
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

const App = () => {
  // Initial cleanup on app start
  useEffect(() => {
    console.log("App starting - checking for stale service workers");
    
    // Check if we have a clean parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clean') === '1') {
      console.log("Clean parameter detected, removing from URL");
      window.history.replaceState({}, '', '/');
    }
    
    // Add debug function to window
    (window as any).debugAuth = () => {
      console.log('=== DEBUG ===');
      console.log('LocalStorage:', localStorage);
      console.log('SessionStorage:', sessionStorage);
      console.log('Cookies:', document.cookie);
    };
    
    (window as any).forceCleanup = fullCleanup;
  }, []);

  return (
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
};

export default App;
