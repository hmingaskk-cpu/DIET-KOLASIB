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

// Service Worker and Cache Management
const initializeServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Clear service worker cache on logout
    window.addEventListener('logout', async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.unregister();
        }
        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('Service worker and caches cleared on logout');
      } catch (error) {
        console.error('Failed to clear service worker:', error);
      }
    });

    // Force service worker update on app start
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.update();
      });
    });
  }
};

// Check for stale auth state on app load
const checkAndClearStaleAuthState = () => {
  const lastAuthTime = localStorage.getItem('last_auth_time');
  const authToken = localStorage.getItem('auth_token');
  const now = Date.now();
  
  // If we have a token but no timestamp, or token is older than 24 hours, clear everything
  if (authToken) {
    if (!lastAuthTime) {
      console.log('Clearing auth: No timestamp found');
      clearAllAuthData();
      return true;
    }
    
    const tokenAge = now - parseInt(lastAuthTime, 10);
    const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours
    
    if (tokenAge > MAX_TOKEN_AGE) {
      console.log('Clearing auth: Token expired (age:', Math.floor(tokenAge / 1000 / 60), 'minutes)');
      clearAllAuthData();
      return true;
    }
  }
  
  return false;
};

const clearAllAuthData = () => {
  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('last_auth_time');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_email');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Clear service worker caches if available
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
};

// Component to handle auth initialization
const AuthStateInitializer = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize service worker
    initializeServiceWorker();
    
    // Check for stale auth on mount
    const shouldClear = checkAndClearStaleAuthState();
    if (shouldClear && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
    
    // Set up beforeunload handler to save auth state
    const handleBeforeUnload = () => {
      if (user) {
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

  return null; // This component doesn't render anything
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setAuthInitialized(true);
    }, 3000); // 3 seconds max for auth initialization

    return () => clearTimeout(timer);
  }, []);

  // Show loading state
  if (loading || !authInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-muted-foreground">Loading application...</p>
        <button
          onClick={() => {
            clearAllAuthData();
            window.location.href = '/login';
          }}
          className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-800"
        >
          Reset App State
        </button>
      </div>
    );
  }

  // FIX: This is now a safe component that won't crash if user is null
  const DashboardSelector = () => {
    if (!user) {
      // Redirect to login if no user
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
        // FIX: Default to Student or a safe page, NEVER Admin
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
    </>
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
