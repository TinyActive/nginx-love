import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function DashboardLayout({ children, title, breadcrumbs }: DashboardLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}