import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { dataLocalISO } from '../lib/datas'
import {
  separarSeries, marcarSuspeitas, agruparPorTreino, montarRanking, ordenarRanking,
  formatarKg, formatarData, gerarCSV,
} from '../lib/progressao'

const PERIODOS = [
  { id: '30', rotulo: '30 dias', dias: 30 },
  { id: '90', rotulo: '90 dias', dias: 90 },
  { id: 'tudo', rotulo: 'Tudo', dias: null },
]

const ABAS = [
  { id: 'exercicios', rotulo: 'Exercícios' },
  { id: 'treinos', rotulo: 'Por treino' },
  { id: 'series', rotulo: 'Séries' },
  { id: 'cardio', rotulo: 'Cardio' },
]

const NOME_TIPO = { aquecimento: 'Aquecimento', feeder: 'Feeder', working: 'Working', backoff: 'Back-off' }

const COLUNAS = [
  { campo: 'exercicio', rotulo: 'Exercício', texto: true },
  { campo: 'treinos', rotulo: 'Treinos' },
  { campo: 'series', rotulo: 'Séries' },
  { campo: 'primeiro', rotulo: '1º treino', texto: true },
  { campo: 'ultimo', rotulo: 'Último', texto: true },
  { campo: 'min', rotulo: 'Mín. kg' },
  { campo: 'max', rotulo: 'Máx. kg' },
  { campo: 'maxPrimeiro', rotulo: 'Máx. 1º' },
  { campo: 'maxUltimo', rotulo: 'Máx. último' },
  { campo: 'evolucao', rotulo: 'Evolução' },
]

function desdeISO(dias) {
  if (!dias) return null
  const d = new Date()
  d.setDate(d.getDate() - dias + 1)
  return dataLocalISO(d)
}

function baixar(nome, conteudo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Evolucao({ valor }) {
  const classe = valor > 0 ? 'evolucao-sobe' : valor < 0 ? 'evolucao-desce' : 'evolucao-igual'
  const sinal = valor > 0 ? '+' : ''
  return <span className={classe}>{sinal}{formatarKg(valor)}</span>
}

// Linha da carga máxima de cada treino
function Tendencia({ dias }) {
  if (dias.length < 2) return null
  const largura = 260
  const altura = 56
  const valores = dias.map((d) => d.max)
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const faixa = max - min || 1
  const pontos = valores.map((v, i) => [
    6 + (i * (largura - 12)) / (valores.length - 1),
    altura - 8 - ((v - min) / faixa) * (altura - 16),
  ])
  return (
    <svg className="tendencia" viewBox={`0 0 ${largura} ${altura}`} role="img"
      aria-label={`Carga máxima por treino: ${valores.map(formatarKg).join(', ')} kg`}>
      <polyline points={pontos.map((p) => p.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pontos.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="currentColor" />)}
    </svg>
  )
}

function DetalheExercicio({ ex }) {
  return (
    <div className="detalhe-progressao">
      <div className="detalhe-progressao-topo">
        <div>
          <p className="texto-secundario">Carga máxima por treino</p>
          <Tendencia dias={ex.dias} />
        </div>
        <p className="texto-secundario">
          Volume total: <strong>{Math.round(ex.volume).toLocaleString('pt-BR')} kg</strong>
        </p>
      </div>
      <ul className="lista-dias-progressao">
        {[...ex.dias].reverse().map((d) => (
          <li key={d.data}>
            <span className="dia-data">{formatarData(d.data)}</span>
            <span className="dia-max">{formatarKg(d.max)} kg</span>
            <span className="dia-series">
              {d.series.map((s, i) => (
                <span key={s.id ?? i} className={s.alerta ? 'serie-alerta' : ''} title={s.alerta || undefined}>
                  {i > 0 && ', '}{formatarKg(s.carga)}×{s.reps}{s.alerta && ' ⚠'}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Progressao() {
  const [historico, setHistorico] = useState(null)
  const [erro, setErro] = useState('')
  const [periodo, setPeriodo] = useState('tudo')
  const [grupo, setGrupo] = useState('Todos')
  const [busca, setBusca] = useState('')
  const [aba, setAba] = useState('exercicios')
  const [ordem, setOrdem] = useState({ campo: 'treinos', direcao: 'desc' })
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    api.getHistory().then((h) => setHistorico(h ?? [])).catch((e) => setErro(e.message))
  }, [])

  const dados = useMemo(() => {
    if (!historico) return null
    const dias = PERIODOS.find((p) => p.id === periodo)?.dias
    const { forca, cardio } = separarSeries(historico, desdeISO(dias))
    const marcadas = marcarSuspeitas(forca)
    const porTreino = agruparPorTreino(marcadas)
    return { forca: marcadas, cardio, porTreino, ranking: montarRanking(porTreino) }
  }, [historico, periodo])

  const grupos = useMemo(
    () => ['Todos', ...new Set((dados?.ranking ?? []).map((e) => e.grupo))].sort((a, b) => (a === 'Todos' ? -1 : b === 'Todos' ? 1 : a.localeCompare(b))),
    [dados],
  )

  const termo = busca.trim().toLowerCase()
  const passa = (item) =>
    (grupo === 'Todos' || item.grupo === grupo) && (!termo || item.exercicio.toLowerCase().includes(termo))

  const ranking = useMemo(
    () => (dados ? ordenarRanking(dados.ranking.filter(passa), ordem.campo, ordem.direcao) : []),
    [dados, grupo, termo, ordem], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const porTreino = (dados?.porTreino ?? []).filter(passa)
    .sort((a, b) => b.data.localeCompare(a.data) || a.exercicio.localeCompare(b.exercicio))
  const series = (dados?.forca ?? []).filter(passa)
    .sort((a, b) => b.data.localeCompare(a.data) || a.exercicio.localeCompare(b.exercicio) || a.serie - b.serie)
  const cardio = [...(dados?.cardio ?? [])].filter((c) => !termo || c.exercicio.toLowerCase().includes(termo))
    .sort((a, b) => b.data.localeCompare(a.data))

  const resumo = {
    treinos: new Set((dados?.forca ?? []).filter(passa).map((s) => s.data)).size,
    series: series.length,
    exercicios: ranking.length,
    alertas: series.filter((s) => s.alerta).length,
  }

  function ordenarPor(campo, texto) {
    setOrdem((o) => (o.campo === campo
      ? { campo, direcao: o.direcao === 'asc' ? 'desc' : 'asc' }
      : { campo, direcao: texto ? 'asc' : 'desc' }))
  }

  function exportar() {
    const hoje = dataLocalISO()
    if (aba === 'exercicios') {
      baixar(`progressao-exercicios-${hoje}.csv`, gerarCSV(
        ['Exercício', 'Grupo', 'Treinos', 'Séries', '1º treino', 'Último treino', 'Carga mín. (kg)', 'Carga máx. (kg)', 'Máx. 1º treino', 'Máx. último treino', 'Evolução (kg)'],
        ranking.map((e) => [e.exercicio, e.grupo, e.treinos, e.series, formatarData(e.primeiro), formatarData(e.ultimo), e.min, e.max, e.maxPrimeiro, e.maxUltimo, e.evolucao]),
      ))
    } else if (aba === 'treinos') {
      baixar(`progressao-por-treino-${hoje}.csv`, gerarCSV(
        ['Data', 'Exercício', 'Séries', 'Carga mín. (kg)', 'Carga máx. (kg)', 'Cargas do dia (kg × reps)'],
        porTreino.map((d) => [formatarData(d.data), d.exercicio, d.qtd, d.min, d.max, d.series.map((s) => `${formatarKg(s.carga)}x${s.reps}`).join(', ')]),
      ))
    } else if (aba === 'series') {
      baixar(`progressao-series-${hoje}.csv`, gerarCSV(
        ['Data', 'Exercício', 'Série', 'Tipo', 'Carga (kg)', 'Repetições', 'Volume (kg)', 'Alerta'],
        series.map((s) => [formatarData(s.data), s.exercicio, s.serie, NOME_TIPO[s.tipo] ?? '', s.carga, s.reps, s.volume, s.alerta ?? '']),
      ))
    } else {
      baixar(`progressao-cardio-${hoje}.csv`, gerarCSV(
        ['Data', 'Atividade', 'Tempo (min)', 'Calorias'],
        cardio.map((c) => [formatarData(c.data), c.exercicio, c.tempo, c.calorias]),
      ))
    }
  }

  return (
    <div className="pagina pagina-larga">
      <header className="cabecalho-pagina">
        <div>
          <h1>Progressão</h1>
          <p className="texto-secundario">Exercícios mais usados e a evolução das cargas</p>
        </div>
      </header>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="cartao filtros-progressao">
        <div className="filtros-chip">
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" className={`chip ${periodo === p.id ? 'chip-ativo' : ''}`} onClick={() => setPeriodo(p.id)}>
              {p.rotulo}
            </button>
          ))}
        </div>
        <div className="linha-dois-campos">
          <label className="campo">
            <span>Buscar exercício</span>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: supino" />
          </label>
          <label className="campo">
            <span>Grupo muscular</span>
            <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
              {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
        </div>
      </div>

      {!dados ? (
        !erro && <p className="texto-secundario">Carregando...</p>
      ) : (
        <>
          <div className="resumo-progressao">
            <div><strong>{resumo.treinos}</strong><span>treinos</span></div>
            <div><strong>{resumo.series}</strong><span>séries</span></div>
            <div><strong>{resumo.exercicios}</strong><span>exercícios</span></div>
            <div className={resumo.alertas ? 'resumo-alerta' : ''}><strong>{resumo.alertas}</strong><span>para conferir</span></div>
          </div>

          <div className="abas-progressao">
            <div className="filtros-chip">
              {ABAS.map((a) => (
                <button key={a.id} type="button" className={`chip ${aba === a.id ? 'chip-ativo' : ''}`} onClick={() => setAba(a.id)}>
                  {a.rotulo}
                </button>
              ))}
            </div>
            <button type="button" className="botao-link botao-link-inline" onClick={exportar}>Baixar CSV</button>
          </div>

          {aba === 'exercicios' && (
            ranking.length === 0 ? <p className="texto-secundario">Nenhum exercício neste filtro.</p> : (
              <>
                <p className="texto-secundario dica-grade">Toque num exercício para ver as cargas de cada treino. Toque no título de uma coluna para ordenar.</p>
                <div className="grade-rolagem">
                  <table className="grade-progressao">
                    <thead>
                      <tr>
                        <th className="col-num">#</th>
                        {COLUNAS.map((c) => (
                          <th key={c.campo} className={c.campo === 'exercicio' ? 'col-fixa' : ''}
                            aria-sort={ordem.campo === c.campo ? (ordem.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}>
                            <button type="button" onClick={() => ordenarPor(c.campo, c.texto)}>
                              {c.rotulo}{ordem.campo === c.campo ? (ordem.direcao === 'asc' ? ' ▲' : ' ▼') : ''}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((e, i) => (
                        <Fragment key={e.exercicio}>
                          <tr className={`linha-grade${aberto === e.exercicio ? ' linha-aberta' : ''}`}
                            onClick={() => setAberto(aberto === e.exercicio ? null : e.exercicio)}>
                            <td className="col-num">{i + 1}</td>
                            <td className="col-fixa">
                              <span className="seta-grade">{aberto === e.exercicio ? '▾' : '▸'}</span>
                              {e.exercicio}{e.alertas > 0 && <span className="marca-alerta" title={`${e.alertas} série(s) para conferir`}> ⚠</span>}
                            </td>
                            <td>{e.treinos}</td>
                            <td>{e.series}</td>
                            <td>{formatarData(e.primeiro)}</td>
                            <td>{formatarData(e.ultimo)}</td>
                            <td>{formatarKg(e.min)}</td>
                            <td>{formatarKg(e.max)}</td>
                            <td>{formatarKg(e.maxPrimeiro)}</td>
                            <td>{formatarKg(e.maxUltimo)}</td>
                            <td><Evolucao valor={e.evolucao} /></td>
                          </tr>
                          {aberto === e.exercicio && (
                            <tr className="linha-detalhe">
                              <td colSpan={COLUNAS.length + 1}><DetalheExercicio ex={e} /></td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="texto-secundario dica-grade">
                  Evolução = carga máxima do último treino menos a do primeiro. ⚠ marca séries com cara de erro de digitação
                  (mais de 30 repetições ou carga muito fora do padrão do exercício).
                </p>
              </>
            )
          )}

          {aba === 'treinos' && (
            <div className="grade-rolagem">
              <table className="grade-progressao">
                <thead>
                  <tr><th className="col-fixa">Exercício</th><th>Data</th><th>Séries</th><th>Mín. kg</th><th>Máx. kg</th><th className="col-texto">Cargas do dia (kg × reps)</th></tr>
                </thead>
                <tbody>
                  {porTreino.map((d) => (
                    <tr key={`${d.exercicio}|${d.data}`}>
                      <td className="col-fixa">{d.exercicio}</td>
                      <td>{formatarData(d.data)}</td>
                      <td>{d.qtd}</td>
                      <td>{formatarKg(d.min)}</td>
                      <td>{formatarKg(d.max)}</td>
                      <td className="col-texto">
                        {d.series.map((s, i) => (
                          <span key={s.id ?? i} className={s.alerta ? 'serie-alerta' : ''} title={s.alerta || undefined}>
                            {i > 0 && ', '}{formatarKg(s.carga)}×{s.reps}{s.alerta && ' ⚠'}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'series' && (
            <div className="grade-rolagem">
              <table className="grade-progressao">
                <thead>
                  <tr><th className="col-fixa">Exercício</th><th>Data</th><th>Série</th><th>Tipo</th><th>Carga kg</th><th>Reps</th><th>Volume</th></tr>
                </thead>
                <tbody>
                  {series.map((s) => (
                    <tr key={s.id} className={s.alerta ? 'linha-alerta' : ''} title={s.alerta || undefined}>
                      <td className="col-fixa">{s.exercicio}{s.alerta && ' ⚠'}</td>
                      <td>{formatarData(s.data)}</td>
                      <td>{s.serie}</td>
                      <td>{NOME_TIPO[s.tipo] ?? '-'}</td>
                      <td>{formatarKg(s.carga)}</td>
                      <td>{s.reps}</td>
                      <td>{Math.round(s.volume).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'cardio' && (
            cardio.length === 0 ? <p className="texto-secundario">Nenhuma sessão de cardio neste período.</p> : (
              <div className="grade-rolagem">
                <table className="grade-progressao">
                  <thead><tr><th className="col-fixa">Atividade</th><th>Data</th><th>Tempo (min)</th><th>Calorias</th></tr></thead>
                  <tbody>
                    {cardio.map((c, i) => (
                      <tr key={c.id ?? i}>
                        <td className="col-fixa">{c.exercicio}</td>
                        <td>{formatarData(c.data)}</td>
                        <td>{formatarKg(c.tempo)}</td>
                        <td>{c.calorias ?? '-'}</td>
                      </tr>
                    ))}
                    <tr className="linha-total">
                      <td className="col-fixa">Total</td>
                      <td></td>
                      <td>{formatarKg(cardio.reduce((n, c) => n + (c.tempo || 0), 0))}</td>
                      <td>{cardio.reduce((n, c) => n + (c.calorias || 0), 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
