import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStore } from "@/store/useStore";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Domains from "./pages/Domains";
import ModSecurity from "./pages/ModSecurity";
import SSL from "./pages/SSL";
import Logs from "./pages/Logs";
import ACL from "./pages/ACL";
import Alerts from "./pages/Alerts";
import Performance from "./pages/Performance";
import Backup from "./pages/Backup";
import Users from "./pages/Users";
import SlaveNodes from "./pages/SlaveNodes";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import "@/lib/i18n";

const queryClient = new QueryClient();

function ProtectedLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { isAuthenticated } = useStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout title={title}>
      {children}
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedLayout title="Dashboard"><Dashboard /></ProtectedLayout>} />
            <Route path="/domains" element={<ProtectedLayout title="Domain Management"><Domains /></ProtectedLayout>} />
            <Route path="/modsecurity" element={<ProtectedLayout title="ModSecurity"><ModSecurity /></ProtectedLayout>} />
            <Route path="/ssl" element={<ProtectedLayout title="SSL Certificates"><SSL /></ProtectedLayout>} />
            <Route path="/logs" element={<ProtectedLayout title="Logs"><Logs /></ProtectedLayout>} />
            <Route path="/alerts" element={<ProtectedLayout title="Alerts"><Alerts /></ProtectedLayout>} />
            <Route path="/acl" element={<ProtectedLayout title="Access Control"><ACL /></ProtectedLayout>} />
            <Route path="/performance" element={<ProtectedLayout title="Performance"><Performance /></ProtectedLayout>} />
            <Route path="/backup" element={<ProtectedLayout title="Backup"><Backup /></ProtectedLayout>} />
            <Route path="/users" element={<ProtectedLayout title="User Management"><Users /></ProtectedLayout>} />
            <Route path="/nodes" element={<ProtectedLayout title="Slave Nodes"><SlaveNodes /></ProtectedLayout>} />
            <Route path="/account" element={<ProtectedLayout title="Account Settings"><Account /></ProtectedLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
