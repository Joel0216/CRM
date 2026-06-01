import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prospects from './pages/Prospects'
import Quote from './pages/Quote'
import ProspectoDetalle from './pages/ProspectoDetalle'

function PrivateRoute({ children }) {
  const user = localStorage.getItem('crm_user')
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/prospectos" element={<PrivateRoute><Prospects /></PrivateRoute>} />
        <Route path="/prospectos/:id" element={<PrivateRoute><ProspectoDetalle /></PrivateRoute>} />
        <Route path="/cotizacion" element={<PrivateRoute><Quote /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
