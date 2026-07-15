import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { PageTransition } from '@/components/ui/page-transition';

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <PageTransition>
          {children}
        </PageTransition>
      </SidebarInset>
    </SidebarProvider>
  );
}
