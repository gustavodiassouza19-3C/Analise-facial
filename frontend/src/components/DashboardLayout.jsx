import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import MobileNav from '@/components/MobileNav';
import { PageTransition } from '@/components/ui/page-transition';

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </SidebarInset>
      <MobileNav />
    </SidebarProvider>
  );
}
