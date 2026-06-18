import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  Package,
  Users,
  LogOut,
  Menu,
  Zap,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const employeeLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/mis-horas', label: 'Mis Horas', icon: ClipboardList },
  { to: '/imputar-horas', label: 'Imputar Horas', icon: Clock },
]

const bossLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/horas-empleados', label: 'Horas Empleados', icon: Users },
  { to: '/recursos', label: 'Recursos', icon: Package },
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
    <div className="min-h-screen flex bg-[#08060f]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f0c1e] border-r border-violet-900/30 shrink-0">
        <SidebarContent links={links} profile={profile} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f0c1e] border-r border-violet-900/30 flex flex-col transform transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent links={links} profile={profile} onSignOut={handleSignOut} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 bg-[#0f0c1e] border-b border-violet-900/30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-violet-400 hover:text-violet-300"
          >
            <Menu size={22} />
          </button>
          <LogoMark />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
        <Zap size={14} className="text-white" />
      </div>
      <span className="font-bold text-white tracking-wide text-lg">VIZZIO</span>
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
      <div className="px-5 py-6 border-b border-violet-900/30">
        <LogoMark />
        <p className="text-xs text-violet-500 mt-1 uppercase tracking-widest">
          Gestión de Recursos
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30'
                  : 'text-violet-400/70 hover:text-violet-300 hover:bg-violet-900/20'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-violet-900/30 space-y-3">
        <div className="px-3 py-2 rounded-lg bg-violet-900/20">
          <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
          <p className="text-xs text-violet-400 capitalize">{profile?.role}</p>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}
