import { Link } from 'react-router-dom'
import { useDescanso } from '../lib/DescansoContext'

function formatar(ms) {
  const total = Math.ceil(ms / 1000)
  const min = Math.floor(total / 60)
  const seg = total % 60
  return `${min}:${String(seg).padStart(2, '0')}`
}

export default function BarraDescanso() {
  const { descanso, restanteMs, encerrado, permissao, cancelar, adicionarSegundos } = useDescanso()
  if (!descanso) return null

  const progresso = descanso.duracaoMs ? 1 - restanteMs / descanso.duracaoMs : 1

  return (
    <div className={`barra-descanso${encerrado ? ' barra-descanso-fim' : ''}`} role="timer" aria-live="polite">
      <div className="barra-descanso-progresso" style={{ transform: `scaleX(${Math.min(1, Math.max(0, progresso))})` }} />
      <div className="barra-descanso-conteudo">
        <div className="barra-descanso-info">
          <span className="barra-descanso-titulo">{encerrado ? 'Descanso encerrado' : 'Descansando'}</span>
          {descanso.rotulo && <span className="barra-descanso-rotulo">{encerrado ? 'Próxima: ' : 'Depois: '}{descanso.rotulo}</span>}
          {permissao === 'denied' && !encerrado && (
            <span className="barra-descanso-rotulo">Notificações bloqueadas no navegador</span>
          )}
        </div>
        <span className="barra-descanso-tempo">{encerrado ? 'Vai!' : formatar(restanteMs)}</span>
        <div className="barra-descanso-acoes">
          {!encerrado && (
            <button type="button" className="botao-mini" onClick={() => adicionarSegundos(30)}>+30s</button>
          )}
          <button type="button" className="botao-mini" onClick={cancelar}>{encerrado ? 'OK' : 'Pular'}</button>
        </div>
      </div>
    </div>
  )
}

export function DicaDescanso() {
  return (
    <p className="texto-secundario dica-descanso">
      Defina o <Link to="/perfil">tempo de descanso no Perfil</Link> para ativar o cronômetro entre séries.
    </p>
  )
}
