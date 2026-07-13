import { ScanFace, GitCompareArrows, Plus } from "lucide-react"
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

export function AppSidebar({ activeTab, onTabChange, ...props }) {
  const tabs = [
    { id: "analise", label: "Análise", icon: ScanFace },
    { id: "comparacao", label: "Comparação", icon: GitCompareArrows },
  ]

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
              {tabs.map(({ id, label, icon: Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={activeTab === id}
                    onClick={() => onTabChange(id)}
                    className={`
                      h-10 px-3 text-[13px] font-medium transition-all duration-150
                      ${activeTab === id
                        ? 'bg-brand-accent/10 text-brand-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                      }
                    `}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="hidden lg:inline truncate">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onTabChange("analise")}
              className="h-10 px-3 text-[13px] font-semibold bg-brand-accent text-background hover:opacity-90 transition-opacity"
            >
              <Plus className="w-[18px] h-[18px] shrink-0" />
              <span className="hidden lg:inline truncate">Iniciar nova análise</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
