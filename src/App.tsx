import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import InvoicingEnhanced from "./pages/InvoicingEnhanced";
import Sales from "./pages/Sales";
import Suppliers from "./pages/Suppliers";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import POS from "./pages/POS";
import Barcodes from "./pages/Barcodes";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import NotFound from "./pages/NotFound";
import { CommandPalette, useCommandPalette } from "./components/CommandPalette";
import WorkerSettings from "@/workers/WorkerSettings";
import WorkerDashboard from "@/workers/WorkerDashboard";
import { WorkerLayout } from "@/workers/WorkerLayout";
import WebsiteManagement from "./pages/WebsiteManagement";
import { CartProvider } from "@/contexts/CartContext";
import WebsiteCommands from "./pages/WebsiteCommands"; // make sure path is correct

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, login, user } = useAuth();
  const { open, setOpen } = useCommandPalette();

  return (
    <>
      <CommandPalette open={open} onOpenChange={setOpen} />
      <Routes>
        {/* LOGIN ROUTE */}
        {!isAuthenticated && (
          <Route path="/login" element={<Login onLogin={login} />} />
        )}

        {/* ADMIN ROUTES */}
        {isAuthenticated && user?.role === "admin" && (
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="invoicing" element={<InvoicingEnhanced />} />
            <Route path="sales" element={<Sales />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="employees" element={<Employees />} />
            <Route path="reports" element={<Reports />} />
            <Route path="pos" element={<POS />} />
            <Route path="barcodes" element={<Barcodes />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
  <Route path="website-commands" element={<WebsiteCommands />} />
            <Route path="website-manage" element={<WebsiteManagement />} />
          </Route>
        )}

        {/* EMPLOYEE ROUTES */}
        {isAuthenticated && user?.role === "employee" && (
          <Route path="/employee" element={<WorkerLayout />}>
            <Route index element={<WorkerDashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="sales" element={<Sales />} />
            <Route path="workersettings" element={<WorkerSettings />} />
          </Route>
        )}
        {/* REDIRECT UNKNOWN */}
        <Route
          path="*"
          element={isAuthenticated ? <NotFound /> : <Login onLogin={login} />}
        />
      </Routes>
    </>
  );
};

const App = () => {
  const [favicon, setFavicon] = useState("/favicon.ico");

  useEffect(() => {
fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.favicon_url) {
          const faviconUrl = `${data.favicon_url}`;
          setFavicon(faviconUrl);

          // Find or create <link rel="icon">
          let link: HTMLLinkElement | null =
            document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }

          // Update favicon with cache-busting
          link.href = `${faviconUrl}?v=${Date.now()}`;
        }
      })
      .catch((err) => console.error("Failed to load favicon:", err));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <div className="min-h-screen bg-background transition-colors duration-300">
                  <AppContent />
                </div>
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
