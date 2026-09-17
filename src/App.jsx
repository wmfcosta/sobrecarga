import { BrowserRouter, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Entrar from './pages/Entrar'
import Treino from './pages/Treino'
import Exercicios from './pages/Exercicios'
import Historico from './pages/Historico'
import Progresso from './pages/Progresso'
import Perfil from './pages/Perfil'
import Avaliacoes from './pages/Avaliacoes'

function AreaLogada() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) return <div className="tela-carregando">Carregando...</div>
  if (!user) return <Entrar />

  return (
    <div className="app-shell">
      <header className="topo-app">
        <div className="marca-wrapper">
          <img src="/icone-96.png" alt="" className="marca-icone" />
          <p className="marca">SOBRECARGA<span>.</span></p>
        </div>
        <div className="usuario-topo">
          <Link to="/perfil" className="link-perfil">{profile?.nome ?? ''}</Link>
          <button className="botao-sair" onClick={signOut}>Sair</button>
        </div>
      </header>

      <main className="conteudo-app">
        <Routes>
          <Route path="/" element={<Treino />} />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/progresso" element={<Progresso />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/avaliacoes" element={<Avaliacoes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="nav-inferior">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-ativo' : ''}>
          <span>Treino</span>
        </NavLink>
        <NavLink to="/exercicios" className={({ isActive }) => isActive ? 'nav-ativo' : ''}>
          <span>Exercícios</span>
        </NavLink>
        <NavLink to="/historico" className={({ isActive }) => isActive ? 'nav-ativo' : ''}>
          <span>Histórico</span>
        </NavLink>
        <NavLink to="/progresso" className={({ isActive }) => isActive ? 'nav-ativo' : ''}>
          <span>Progresso</span>
        </NavLink>
        <NavLink to="/avaliacoes" className={({ isActive }) => isActive ? 'nav-ativo' : ''}>
          <span>Avaliação</span>
        </NavLink>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AreaLogada />
      </AuthProvider>
    </BrowserRouter>
  )
}
