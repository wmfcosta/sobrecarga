import { useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { DescansoProvider } from './lib/DescansoContext'
import BarraDescanso from './components/BarraDescanso'
import MenuApp from './components/MenuApp'
import Entrar from './pages/Entrar'
import Treino from './pages/Treino'
import Exercicios from './pages/Exercicios'
import Historico from './pages/Historico'
import Progresso from './pages/Progresso'
import Perfil from './pages/Perfil'
import Avaliacoes from './pages/Avaliacoes'
import Plano from './pages/Plano'
import Prescricao from './pages/Prescricao'

function AreaLogada() {
  const { user, profile, loading, signOut } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const fecharMenu = useCallback(() => setMenuAberto(false), [])

  if (loading) return <div className="tela-carregando">Carregando...</div>
  if (!user) return <Entrar />

  const ehPersonal = profile?.role === 'personal'

  return (
    <div className="app-shell">
      <header className="topo-app">
        <div className="marca-wrapper">
          <button
            type="button"
            className="botao-menu"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link to="/" className="marca-link" aria-label="Ir para o treino">
            <img src="/marca.png" alt="" className="marca-icone" />
            <p className="marca">SOBRECARGA<span>.</span></p>
          </Link>
        </div>
        <div className="usuario-topo">
          <Link to="/perfil" className="link-perfil">{profile?.nome ?? ''}</Link>
        </div>
      </header>

      <MenuApp
        aberto={menuAberto}
        onFechar={fecharMenu}
        ehPersonal={ehPersonal}
        nome={profile?.nome}
        onSair={signOut}
      />

      <main className="conteudo-app">
        <Routes>
          <Route path="/" element={<Treino />} />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/progresso" element={<Progresso />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/avaliacoes" element={<Avaliacoes />} />
          <Route path="/plano" element={<Plano />} />
          {ehPersonal && <Route path="/prescricao" element={<Prescricao />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BarraDescanso />

    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DescansoProvider>
          <AreaLogada />
        </DescansoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
