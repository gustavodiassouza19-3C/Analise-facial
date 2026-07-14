import { ScanFace, GitCompareArrows, BarChart3, UserCircle, Plus } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import logo from "@/assets/logo.png"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { path: "/dashboard", label: "Análise", icon: ScanFace },
  { path: "/dashboard/progress", label: "Progresso", icon: BarChart3 },
  { path: "/dashboard/profile", label: "Meu Perfil", icon: UserCircle },
]

export function AppSidebar({ ...props }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Sidebar className="border-r border-border" {...props}>
      {/* Logo */}
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          <div className="hidden lg:block">
            <p className="text-[13px] font-bold tracking-wide text-text-primary leading-tight">
              MOGGED<span className="text-brand-accent">.</span>
            </p>
            <p className="text-[10px] text-text-muted leading-tight">Facial Analysis</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path
                return (
                  <SidebarMenuItem key={path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(path)}
                      className={`
                        h-10 px-3 text-[13px] font-medium transition-all duration-150
                        ${isActive
                          ? 'bg-brand-accent/10 text-brand-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="hidden lg:inline truncate">{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/dashboard')}
              className="h-10 px-3 text-[13px] font-semibold bg-brand-accent text-background hover:opacity-90 transition-opacity"
            >
              <Plus className="w-[18px] h-[18px] shrink-0" />
              <span className="hidden lg:inline truncate">Nova Análise</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
