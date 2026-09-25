import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

// Ícones de traço simples (24x24), herdam a cor do texto
const ICONES = {
  treino: <path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" />,
  exercicios: <><path d="M4 6h16M4 12h16M4 18h10" /></>,
  historico: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  progresso: <><path d="M4 19h16" /><path d="M5 15l4-4 3 3 6-6" /><path d="M15 8h3v3" /></>,
  avaliacao: <><path d="M8 4h8l1 2h2v14H5V6h2l1-2z" /><path d="M9 12h6M9 16h4" /></>,
  plano: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  prescricao: <><path d="M5 19l1-4L16 5l3 3L9 18l-4 1z" /><path d="M14 7l3 3" /></>,
  perfil: <><circle cx="12" cy="9" r="3.5" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" /></>,
  sair: <><path d="M14 5h4v14h-4" /><path d="M10 8l-4 4 4 4M6 12h9" /></>,
}

function Icone({ nome }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[nome]}
    </svg>
  )
}

function itensMenu(ehPersonal) {
  return [
    { to: '/', rotulo: 'Treino', icone: 'treino', end: true },
    { to: '/exercicios', rotulo: 'Exercícios', icone: 'exercicios' },
    { to: '/historico', rotulo: 'Histórico', icone: 'historico' },
    { to: '/progresso', rotulo: 'Progresso', icone: 'progresso' },
    { to: '/avaliacoes', rotulo: 'Avaliação', icone: 'avaliacao' },
    { to: '/plano', rotulo: 'Plano', icone: 'plano' },
    ...(ehPersonal ? [{ to: '/prescricao', rotulo: 'Prescrever', icone: 'prescricao' }] : []),
  ]
}

export default function MenuApp({ aberto, onFechar, ehPersonal, nome, onSair }) {
  const local = useLocation()
  const painelRef = useRef(null)

  // Fecha ao trocar de página
  useEffect(() => { onFechar() }, [local.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Esc fecha; foco vai para o painel ao abrir; trava a rolagem do fundo
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e) => { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    painelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])

  const classeLink = ({ isActive }) => `menu-item${isActive ? ' menu-item-ativo' : ''}`

  return (
    <div className={`menu-camada${aberto ? ' menu-aberto' : ''}`} aria-hidden={!aberto}>
      <div className="menu-fundo" onClick={onFechar} />
      <nav
        id="menu-principal"
        ref={painelRef}
        className="menu-painel"
        tabIndex={-1}
        aria-label="Menu principal"
      >
        <div className="menu-topo">
          <div className="marca-wrapper">
            <img src="/marca.png" alt="" className="marca-icone" />
            <p className="marca">SOBRECARGA<span>.</span></p>
          </div>
          <button type="button" className="menu-fechar" onClick={onFechar} aria-label="Fechar menu">×</button>
        </div>

        <ul className="menu-lista">
          {itensMenu(ehPersonal).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={classeLink} tabIndex={aberto ? 0 : -1}>
                <Icone nome={item.icone} />
                <span>{item.rotulo}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="menu-rodape">
          <NavLink to="/perfil" className={classeLink} tabIndex={aberto ? 0 : -1}>
            <Icone nome="perfil" />
            <span>Perfil{nome ? ` · ${nome}` : ''}</span>
          </NavLink>
          <button type="button" className="menu-item menu-sair" onClick={onSair} tabIndex={aberto ? 0 : -1}>
            <Icone nome="sair" />
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
