import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
});

// Service Worker Management
const initializeServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Force service worker update on app start
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.update();
      });
    });
  }
};

// Component to handle auth initialization and state management
const AuthStateInitializer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize service worker
    initializeServiceWorker();
    
    // Check for service worker conflicts on login page
    if (location.pathname === '/login' || location.pathname === '/forgot-password') {
      // Clear any stale service worker state on auth pages
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            // Send message to service worker to clear auth-related caches
            registration.active?.postMessage({ type: 'CLEAR_AUTH_CACHE' });
          }
        });
      }
    }
    
    // Set up beforeunload handler to save auth state
    const handleBeforeUnload = () => {
      if (user) {
        // Only update last_auth_time if we have a valid user
        localStorage.setItem('last_auth_time', Date.now().toString());
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, navigate, location.pathname]);

  // Effect to update last auth time when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('last_auth_time', Date.now().toString());
    }
  }, [user]);

  return null;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setAuthInitialized(true);
      // Show reset button after 3 seconds of loading
      if (loading) {
        setShowResetButton(true);
      }
    }, 3000); // 3 seconds max for auth initialization

    return () => clearTimeout(timer);
  }, [loading]);

  // Function to clear all auth data
  const clearAllAuthData = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('last_auth_time');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('sb-uyhlvjkcagzihzngttei-auth-token'); // Supabase specific token
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Dispatch logout event for service worker
    window.dispatchEvent(new Event('logout'));
    
    // Clear service worker caches if available
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
  };

  // Show loading state
  if (loading || !authInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-muted-foreground">Loading application...</p>
        
        {showResetButton && (
          <button
            onClick={() => {
              clearAllAuthData();
              // Force a hard reload to clear service worker
              window.location.href = '/login';
            }}
            className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Reset App State
          </button>
        )}
      </div>
    );
  }

  const DashboardSelector = () => {
    if (!user) {
      // If no user but we're here, something is wrong - redirect to login
      window.location.href = '/login';
      return null;
    }

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
        console.warn("Unknown role detected, defaulting to Student Dashboard");
        return <StudentDashboard />;
    }
  };

  return (
    <>
      <AuthStateInitializer />
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
    </>
  );
};

const App = () => {
  // Listen for logout events from AuthContext
  useEffect(() => {
    const handleLogoutEvent = () => {
      // Clear any pending states
      localStorage.removeItem('last_auth_time');
    };

    window.addEventListener('logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('logout', handleLogoutEvent);
    };
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
