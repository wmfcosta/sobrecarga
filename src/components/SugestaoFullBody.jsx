import { useMemo, useState } from 'react'
import { gerarSugestao, itemComExercicio } from '../lib/sugestaoFullBody'

const CHAVE_ABERTO = 'sobrecarga_sugestao_aberta'

function lerAberto() {
  try {
    return localStorage.getItem(CHAVE_ABERTO) !== '0'
  } catch {
    return true
  }
}

function formatarCarga(carga) {
  if (carga == null) return null
  if (carga === 0) return 'peso corporal'
  return `${String(carga).replace('.', ',')} kg`
}

export default function SugestaoFullBody({ exercicios, historico, seriesHoje, hoje, onUsar }) {
  const [aberto, setAberto] = useState(lerAberto)
  const [trocas, setTrocas] = useState({}) // índice do item -> posição na lista de alternativas

  const historicoCompleto = useMemo(
    () => [...(historico || []).filter((t) => t.data !== hoje), { data: hoje, series: seriesHoje || [] }],
    [historico, seriesHoje, hoje]
  )

  const sugestao = useMemo(
    () => (exercicios.length ? gerarSugestao({ exercicios, historico: historicoCompleto, hoje }) : null),
    [exercicios, historicoCompleto, hoje]
  )

  if (!sugestao || sugestao.itens.length === 0) return null

  const itens = sugestao.itens.map((item, i) => {
    const pos = trocas[i]
    if (pos == null || !item.alternativas.length || item.seriesFeitasHoje > 0) return item
    const alternativa = item.alternativas[pos % item.alternativas.length]
    return itemComExercicio(item, alternativa, historicoCompleto, hoje)
  })
  const concluidos = itens.filter((i) => i.concluido).length

  function alternar() {
    setAberto((v) => {
      try { localStorage.setItem(CHAVE_ABERTO, v ? '0' : '1') } catch { /* ignora */ }
      return !v
    })
  }

  return (
    <section className="cartao sugestao">
      <button type="button" className="sugestao-cabecalho" onClick={alternar} aria-expanded={aberto}>
        <div>
          <p className="nome-exercicio">Sugestão full body</p>
          <p className="texto-secundario">
            {concluidos}/{itens.length} exercícios feitos hoje
          </p>
        </div>
        <span className="sugestao-seta" aria-hidden>{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <>
          <div className="sugestao-semana" aria-label="Séries na semana por padrão de movimento">
            {sugestao.resumoSemana.map((p) => (
              <div key={p.padrao} className="sugestao-semana-item">
                <span>{p.rotulo}</span>
                <div className="sugestao-barra">
                  <div style={{ width: `${Math.min(100, (p.feitas / p.meta) * 100)}%` }} />
                </div>
                <small>{p.feitas}/{p.meta}</small>
              </div>
            ))}
          </div>
          <p className="texto-secundario sugestao-legenda">Séries na semana por padrão de movimento</p>

          <ul className="sugestao-lista">
            {itens.map((item, i) => (
              <li key={`${item.padrao}-${i}`} className={`sugestao-item${item.concluido ? ' sugestao-item-feito' : ''}`}>
                <div className="sugestao-item-topo">
                  <span className="chip-padrao">{item.rotuloPadrao}</span>
                  <span className="sugestao-progresso">
                    {item.concluido ? '✓ feito' : item.seriesFeitasHoje > 0 ? `${item.seriesFeitasHoje}/${item.series} séries` : ''}
                  </span>
                </div>
                <p className="sugestao-nome">{item.exercicio.nome}</p>
                <p className="sugestao-prescricao">
                  {item.series}×{item.faixa} reps
                  {formatarCarga(item.carga) && <> · <strong>{formatarCarga(item.carga)}</strong></>}
                </p>
                <p className="texto-secundario sugestao-motivo">{item.motivo}</p>
                {!item.concluido && (
                  <div className="sugestao-acoes">
                    <button type="button" className="botao-mini botao-mini-salvar" onClick={() => onUsar(item)}>
                      Usar
                    </button>
                    {item.seriesFeitasHoje === 0 && item.alternativas.length > 0 && (
                      <button
                        type="button"
                        className="botao-mini"
                        onClick={() => setTrocas((t) => ({ ...t, [i]: (t[i] ?? -1) + 1 }))}
                      >
                        Trocar
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
