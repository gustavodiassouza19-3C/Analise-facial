import { ScanFace, BarChart3, UserCircle, Plus, FileText, Camera, ClipboardList } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
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

const clientNavItems = [
  { path: "/dashboard", label: "Analise", icon: ScanFace },
  { path: "/dashboard/reports", label: "Meus Relatorios", icon: FileText },
  { path: "/dashboard/photo-guide", label: "Guia de Fotos", icon: Camera },
  { path: "/dashboard/progress", label: "Progresso", icon: BarChart3 },
]

const professionalNavItems = [
  { path: "/professional/dashboard", label: "Painel Profissional", icon: ClipboardList },
  { path: "/professional/dashboard", label: "Voltar ao Cliente", icon: ScanFace, href: "/dashboard" },
]

const adminNavItems = [
  { path: "/dashboard/admin", label: "Fila de Analises", icon: ClipboardList },
  { path: "/professional/dashboard", label: "Painel Profissional", icon: ScanFace },
]

export function AppSidebar({ ...props }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const role = user?.role || 'client'

  let navItems = clientNavItems
  if (role === 'professional') {
    navItems = professionalNavItems
  } else if (role === 'admin') {
    navItems = adminNavItems
  }

  return (
    <Sidebar className="border-r border-border" {...props}>
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          <div className="hidden lg:block">
            <p className="text-[13px] font-bold tracking-wide text-text-primary leading-tight">
              FACE<span className="text-brand-accent">MAX</span>
            </p>
            <p className="text-[10px] text-text-muted leading-tight">
              {role === 'professional' || role === 'admin' ? 'Painel Profissional' : 'Elite da Estetica'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path
                return (
                  <SidebarMenuItem key={path + label}>
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

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate(role === 'professional' || role === 'admin' ? '/professional/dashboard' : '/dashboard')}
              className="h-10 px-3 text-[13px] font-semibold bg-brand-accent text-background hover:opacity-90 transition-opacity"
            >
              <Plus className="w-[18px] h-[18px] shrink-0" />
              <span className="hidden lg:inline truncate">
                {role === 'professional' || role === 'admin' ? 'Ver Fila' : 'Nova Analise'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <div className="h-px bg-border my-1" />
          {role === 'client' && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/dashboard/profile')}
                className={`h-10 px-3 text-[13px] font-medium transition-all duration-150 ${
                  location.pathname === '/dashboard/profile'
                    ? 'bg-brand-accent/10 text-brand-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                }`}
              >
                <UserCircle className="w-[18px] h-[18px] shrink-0" />
                <span className="hidden lg:inline truncate">Meu Perfil</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
