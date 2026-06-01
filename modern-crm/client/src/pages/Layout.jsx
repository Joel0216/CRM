import { useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../data'
import logo from '../../../../Recursos/Logotipos/cicloambiental.png'

const NAV = [
  {
    section: 'PRINCIPAL',
    items: [{ path: '/', label: 'Dashboard' }],
  },
  {
    section: 'PROSPECTOS',
    items: [
      { path: '/prospectos', label: 'Prospectos' },
      { path: '/cotizacion', label: 'Cotizador' },
    ],
  },
]

export default function Layout({ children, title }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = auth.getUser()

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  const pageTitle = title || NAV.flatMap(g => g.items).find(i => i.path === location.pathname)?.label || 'CRM'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Ciclo Ambiental" className="sidebar-logo-img" />
        </div>

        <nav className="sidebar-nav">
          {NAV.map(group => (
            <div key={group.section}>
              <div className="nav-section-title">{group.section}</div>
              {group.items.map(item => (
                <button
                  key={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.nombre?.charAt(0) || 'U'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.nombre || 'Usuario'}
              </div>
              <div className="user-rol">{user?.rol || 'usuario'}</div>
            </div>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', fontSize: 12, padding: '5px 10px', borderRadius: 6 }}
              onClick={handleLogout}
              title="Cerrar sesion"
            >Salir</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-dot"></div>
          <span className="topbar-title">{pageTitle}</span>
        </div>
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  )
}
