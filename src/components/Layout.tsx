import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  Package,
  Users,
  UserPlus,
  LogOut,
  Menu,
  Zap,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const employeeLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/mis-horas', label: 'Mis horas', icon: ClipboardList },
  { to: '/imputar-horas', label: 'Imputar horas', icon: Clock },
]

const bossLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/horas-empleados', label: 'Horas del equipo', icon: Users },
  { to: '/recursos', label: 'Recursos', icon: Package },
  { to: '/empleados', label: 'Empleados', icon: UserPlus },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = profile?.role === 'jefe' ? bossLinks : employeeLinks

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-black shrink-0">
        <SidebarContent links={links} profile={profile} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-black flex flex-col transform transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent links={links} profile={profile} onSignOut={handleSignOut} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-12 bg-white border-b border-[#d2d2d7]">
          <button onClick={() => setMobileOpen(true)} className="text-[#1d1d1f]">
            <Menu size={20} />
          </button>
          <LogoMark />
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-auto bg-[#f5f5f7]">{children}</main>
      </div>
    </div>
  )
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-[#0066cc] flex items-center justify-center">
        <Zap size={13} className="text-white" />
      </div>
      <span className="font-semibold text-[#1d1d1f] tracking-tight text-base">Vizzio</span>
    </div>
  )
}

function SidebarContent({
  links,
  profile,
  onSignOut,
}: {
  links: typeof employeeLinks
  profile: ReturnType<typeof useAuth>['profile']
  onSignOut: () => void
}) {
  return (
    <>
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0066cc] flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white tracking-tight text-lg">Vizzio</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-[#86868b] hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-4 border-t border-white/10 space-y-2 mt-auto">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
          <p className="text-xs text-[#86868b] capitalize mt-0.5">{profile?.role}</p>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#86868b] hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}
