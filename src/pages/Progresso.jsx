import { useEffect, useMemo, useState } from 'react'
import { dataLocalISO } from '../lib/datas'
import { api } from '../lib/api'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

const CORES = { ferrugem: '#e8542e', aco: '#5b7a94', texto: '#8a9098', borda: '#30353c' }

const tooltipStyle = {
  background: '#1c1f24',
  border: '1px solid #30353c',
  borderRadius: 8,
  color: '#edeef0',
  fontSize: 13,
}

export default function Progresso() {
  const [treinos, setTreinos] = useState([])
  const [avaliacoes, setAvaliacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [exercicioForca, setExercicioForca] = useState('')
  const [exercicioCardio, setExercicioCardio] = useState('')

  useEffect(() => {
    Promise.all([api.getHistory(), api.listAssessments()]).then(([historico, avals]) => {
      setTreinos(historico ?? [])
      setAvaliacoes(avals ?? [])
      setCarregando(false)
    })
  }, [])

  const dadosPeso = useMemo(
    () => [...avaliacoes]
      .filter((a) => a.peso_kg != null)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((a) => ({ data: formatarCurto(a.data), peso: Number(a.peso_kg) })),
    [avaliacoes]
  )

  const dadosGordura = useMemo(
    () => [...avaliacoes]
      .filter((a) => a.percentual_gordura != null)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((a) => ({ data: formatarCurto(a.data), gordura: Number(a.percentual_gordura) })),
    [avaliacoes]
  )

  const registros = useMemo(() => {
    const lista = []
    for (const t of treinos) {
      for (const s of t.series) lista.push({ ...s, data: t.data })
    }
    return lista
  }, [treinos])

  const nomesForca = useMemo(
    () => [...new Set(registros.filter((r) => r.carga_kg != null).map((r) => r.exercicio_nome))].sort(),
    [registros]
  )
  const nomesCardio = useMemo(
    () => [...new Set(registros.filter((r) => r.tempo_min != null).map((r) => r.exercicio_nome))].sort(),
    [registros]
  )

  useEffect(() => {
    if (!exercicioForca && nomesForca.length) setExercicioForca(nomesForca[0])
  }, [nomesForca, exercicioForca])

  useEffect(() => {
    if (!exercicioCardio && nomesCardio.length) setExercicioCardio(nomesCardio[0])
  }, [nomesCardio, exercicioCardio])

  const dadosForca = useMemo(() => {
    const porDia = {}
    for (const r of registros) {
      if (r.exercicio_nome !== exercicioForca || r.carga_kg == null) continue
      porDia[r.data] = Math.max(porDia[r.data] ?? 0, Number(r.carga_kg))
    }
    return Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, carga]) => ({ data: formatarCurto(data), carga }))
  }, [registros, exercicioForca])

  const dadosCardio = useMemo(() => {
    const porDia = {}
    for (const r of registros) {
      if (r.exercicio_nome !== exercicioCardio || r.calorias == null) continue
      porDia[r.data] = (porDia[r.data] ?? 0) + Number(r.calorias)
    }
    return Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, calorias]) => ({ data: formatarCurto(data), calorias }))
  }, [registros, exercicioCardio])

  const dadosFrequencia = useMemo(() => {
    const diasUnicos = [...new Set(treinos.map((t) => t.data))]
    const porSemana = {}
    for (const dia of diasUnicos) {
      const chave = inicioDaSemana(dia)
      porSemana[chave] = (porSemana[chave] ?? 0) + 1
    }
    return Object.entries(porSemana)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([semana, dias]) => ({ semana: formatarCurto(semana), dias }))
  }, [treinos])

  if (carregando) {
    return (
      <div className="pagina">
        <header className="cabecalho-pagina">
          <div>
            <h1>Progresso</h1>
            <p className="texto-secundario">Comparativos dos seus treinos</p>
          </div>
        </header>
        <p className="texto-secundario">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Progresso</h1>
          <p className="texto-secundario">Comparativos dos seus treinos</p>
        </div>
      </header>

      <div className="cartao">
        <p className="nome-exercicio">Peso corporal</p>
        {dadosPeso.length < 2 ? (
          <p className="texto-secundario">Registre pelo menos 2 avaliações para ver o comparativo.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosPeso} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={CORES.borda} vertical={false} />
              <XAxis dataKey="data" stroke={CORES.texto} fontSize={12} tickLine={false} />
              <YAxis stroke={CORES.texto} fontSize={12} tickLine={false} unit="kg" domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: CORES.texto }} />
              <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke={CORES.aco} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="cartao">
        <p className="nome-exercicio">Percentual de gordura</p>
        {dadosGordura.length < 2 ? (
          <p className="texto-secundario">Registre pelo menos 2 avaliações para ver o comparativo.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosGordura} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={CORES.borda} vertical={false} />
              <XAxis dataKey="data" stroke={CORES.texto} fontSize={12} tickLine={false} />
              <YAxis stroke={CORES.texto} fontSize={12} tickLine={false} unit="%" domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: CORES.texto }} />
              <Line type="monotone" dataKey="gordura" name="% Gordura" stroke={CORES.ferrugem} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="cartao">
        <div className="cabecalho-grafico">
          <p className="nome-exercicio">Carga por exercício</p>
          {nomesForca.length > 0 && (
            <select value={exercicioForca} onChange={(e) => setExercicioForca(e.target.value)}>
              {nomesForca.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>
        {nomesForca.length === 0 ? (
          <p className="texto-secundario">Registre algumas séries para ver o comparativo.</p>
        ) : dadosForca.length < 2 ? (
          <p className="texto-secundario">Registre este exercício em pelo menos 2 dias diferentes para comparar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosForca} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={CORES.borda} vertical={false} />
              <XAxis dataKey="data" stroke={CORES.texto} fontSize={12} tickLine={false} />
              <YAxis stroke={CORES.texto} fontSize={12} tickLine={false} unit="kg" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: CORES.texto }} />
              <Line type="monotone" dataKey="carga" name="Carga (kg)" stroke={CORES.ferrugem} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="cartao">
        <div className="cabecalho-grafico">
          <p className="nome-exercicio">Calorias no cardio</p>
          {nomesCardio.length > 0 && (
            <select value={exercicioCardio} onChange={(e) => setExercicioCardio(e.target.value)}>
              {nomesCardio.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>
        {nomesCardio.length === 0 ? (
          <p className="texto-secundario">Registre algum exercício de cardio para ver o comparativo.</p>
        ) : dadosCardio.length < 2 ? (
          <p className="texto-secundario">Registre este exercício em pelo menos 2 dias diferentes para comparar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosCardio} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={CORES.borda} vertical={false} />
              <XAxis dataKey="data" stroke={CORES.texto} fontSize={12} tickLine={false} />
              <YAxis stroke={CORES.texto} fontSize={12} tickLine={false} unit="kcal" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: CORES.texto }} />
              <Bar dataKey="calorias" name="Calorias" fill={CORES.aco} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="cartao">
        <p className="nome-exercicio">Dias de treino por semana</p>
        {dadosFrequencia.length === 0 ? (
          <p className="texto-secundario">Registre treinos para ver sua frequência semanal.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosFrequencia} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={CORES.borda} vertical={false} />
              <XAxis dataKey="semana" stroke={CORES.texto} fontSize={12} tickLine={false} />
              <YAxis stroke={CORES.texto} fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: CORES.texto }} />
              <Bar dataKey="dias" name="Dias treinados" fill={CORES.ferrugem} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function formatarCurto(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function inicioDaSemana(iso) {
  const d = new Date(iso + 'T00:00:00')
  const diaSemana = (d.getDay() + 6) % 7 // 0 = segunda
  d.setDate(d.getDate() - diaSemana)
  return dataLocalISO(d)
}
