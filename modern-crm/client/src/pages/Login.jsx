import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../data'
import logo from '../../../../Recursos/Logotipos/cicloambiental.png'

export default function Login() {
  const [form, setForm] = useState({ usuario: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const result = auth.login(form.usuario, form.password)
      if (result.ok) {
        navigate('/')
      } else {
        setError(result.error)
      }
      setLoading(false)
    }, 350)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Ciclo Ambiental" style={{ height: 72, width: 'auto' }} />
          <p>Sistema de Gestion Comercial</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              id="login-usuario"
              className="form-input"
              type="text"
              placeholder="Ingresa tu usuario"
              value={form.usuario}
              onChange={e => setForm({ ...form, usuario: e.target.value })}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contrasena</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
          </div>
          <button
            id="login-submit"
            className="btn btn-primary btn-lg w-full"
            type="submit"
            disabled={loading}
            style={{ justifyContent: 'center', marginTop: 8 }}
          >
            {loading ? 'Verificando...' : 'Iniciar sesion'}
          </button>
        </form>

        <p className="text-muted text-xs mt-4" style={{ textAlign: 'center' }}>
          Demo: admin / admin123
        </p>
      </div>
    </div>
  )
}
