import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { useStore } from "@/store/useStore";
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

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/domains" element={<ProtectedLayout><Domains /></ProtectedLayout>} />
          <Route path="/modsecurity" element={<ProtectedLayout><ModSecurity /></ProtectedLayout>} />
          <Route path="/ssl" element={<ProtectedLayout><SSL /></ProtectedLayout>} />
          <Route path="/logs" element={<ProtectedLayout><Logs /></ProtectedLayout>} />
          <Route path="/alerts" element={<ProtectedLayout><Alerts /></ProtectedLayout>} />
          <Route path="/acl" element={<ProtectedLayout><ACL /></ProtectedLayout>} />
          <Route path="/performance" element={<ProtectedLayout><Performance /></ProtectedLayout>} />
          <Route path="/backup" element={<ProtectedLayout><Backup /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout><Users /></ProtectedLayout>} />
          <Route path="/nodes" element={<ProtectedLayout><SlaveNodes /></ProtectedLayout>} />
          <Route path="/account" element={<ProtectedLayout><Account /></ProtectedLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
