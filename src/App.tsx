import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AppPage from "./pages/App";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface UserData {
  token: string;
  user_id: number;
  username: string;
  is_admin: boolean;
}

const App = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("svyaz_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("svyaz_user");
        localStorage.removeItem("svyaz_token");
      }
    }
    setChecking(false);
  }, []);

  const handleLogin = (data: UserData) => {
    setUser(data);
  };

  const handleLogout = () => {
    localStorage.removeItem("svyaz_user");
    localStorage.removeItem("svyaz_token");
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-[#b9bbbe]">Загрузка...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Лендинг — всегда доступен */}
            <Route path="/" element={<Index />} />

            {/* Авторизация — только для неавторизованных */}
            <Route
              path="/auth"
              element={
                user ? <Navigate to="/app" replace /> : <Auth onLogin={handleLogin} />
              }
            />

            {/* Приложение — только для авторизованных */}
            <Route
              path="/app"
              element={
                user ? (
                  <AppPage />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />

            {/* Админка — только для администраторов */}
            <Route
              path="/admin"
              element={
                user?.is_admin ? (
                  <Admin
                    token={user.token}
                    currentUserId={user.user_id}
                    onLogout={handleLogout}
                  />
                ) : (
                  <Navigate to={user ? "/" : "/auth"} replace />
                )
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;