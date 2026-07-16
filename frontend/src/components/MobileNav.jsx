import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { ScanFace, BarChart3, UserCircle, FileText, Camera, LogOut } from "lucide-react"

const clientNavItems = [
  { path: "/dashboard", label: "Análise", icon: ScanFace },
  { path: "/dashboard/reports", label: "Relatórios", icon: FileText },
  { path: "/dashboard/progress", label: "Progresso", icon: BarChart3 },
  { path: "/dashboard/profile", label: "Perfil", icon: UserCircle },
]

const professionalNavItems = [
  { path: "/professional/dashboard", label: "Fila", icon: FileText },
  { path: "/dashboard", label: "Cliente", icon: ScanFace },
]

const adminNavItems = [
  { path: "/dashboard/admin", label: "Fila", icon: FileText },
  { path: "/professional/dashboard", label: "Pro", icon: ScanFace },
  { path: "/dashboard/profile", label: "Perfil", icon: UserCircle },
]

export default function MobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()

  const role = user?.role || "client"

  let navItems = clientNavItems
  if (role === "professional") navItems = professionalNavItems
  else if (role === "admin") navItems = adminNavItems

  const handleLogout = async () => {
    await signOut()
    navigate("/login")
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-card-bg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path + label}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-brand-accent"
                  : "text-text-muted active:text-text-secondary"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[9px] font-medium leading-none">{label}</span>
            </button>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-lg text-text-muted active:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.8} />
          <span className="text-[9px] font-medium leading-none">Sair</span>
        </button>
      </div>
    </nav>
  )
}
