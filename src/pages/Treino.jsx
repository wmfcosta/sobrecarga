import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import VisualizadorGif from '../components/VisualizadorGif'

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

export default function Treino() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(searchParams.get('data') || hoje())
  const [treino, setTreino] = useState(null)
  const [series, setSeries] = useState([])
  const [exercicios, setExercicios] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [exercicioId, setExercicioId] = useState('')
  const [buscaExercicio, setBuscaExercicio] = useState('')
  const [serieNumero, setSerieNumero] = useState(1)
  const [carga, setCarga] = useState('')
  const [repeticoes, setRepeticoes] = useState('')
  const [tempoMin, setTempoMin] = useState('')
  const [calorias, setCalorias] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [gifAmpliado, setGifAmpliado] = useState(null)

  const exercicioSelecionado = exercicios.find((ex) => ex.id === exercicioId)
  const ehCardio = exercicioSelecionado?.grupo_muscular === 'Cardio'

  useEffect(() => {
    api.listExercises().then((data) => {
      setExercicios(data ?? [])
      if (data?.length && !exercicioId) {
        setExercicioId(data[0].id)
        setBuscaExercicio(data[0].nome)
      }
    })
  }, [])

  function selecionarPorNome(nomeDigitado) {
    setBuscaExercicio(nomeDigitado)
    const encontrado = exercicios.find((ex) => ex.nome.toLowerCase() === nomeDigitado.toLowerCase())
    if (encontrado) setExercicioId(encontrado.id)
  }

  async function carregarTreinoDoDia() {
    setCarregando(true)
    const resposta = await api.getWorkout(data)
    setTreino(resposta.treino)
    setSeries(resposta.series ?? [])
    setCarregando(false)
    return resposta.series ?? []
  }

  useEffect(() => {
    carregarTreinoDoDia().then((seriesCarregadas) => {
      const editarId = searchParams.get('editar')
      if (editarId) {
        const alvo = seriesCarregadas.find((s) => s.id === editarId)
        if (alvo) iniciarEdicao(alvo)
        const novosParams = new URLSearchParams(searchParams)
        novosParams.delete('editar')
        setSearchParams(novosParams, { replace: true })
      }
    })
  }, [data])

  // Quando troca de exercício (fora de uma edição), sugere o próximo número de série
  useEffect(() => {
    if (editandoId) return
    const doExercicio = series.filter((s) => s.exercise_id === exercicioId)
    setSerieNumero(doExercicio.length + 1)
  }, [exercicioId, series, editandoId])

  async function garantirTreino() {
    if (treino) return treino
    const novo = await api.ensureWorkout(data)
    setTreino(novo)
    return novo
  }

  function limparFormulario() {
    setCarga('')
    setRepeticoes('')
    setTempoMin('')
    setCalorias('')
    setEditandoId(null)
  }

  function iniciarEdicao(set) {
    const ex = exercicios.find((e) => e.id === set.exercise_id)
    setEditandoId(set.id)
    setExercicioId(set.exercise_id)
    setBuscaExercicio(ex?.nome ?? set.exercicio_nome ?? '')
    setSerieNumero(set.numero_serie)
    if (set.tempo_min != null) {
      setTempoMin(String(set.tempo_min))
      setCalorias(String(set.calorias ?? ''))
      setCarga('')
      setRepeticoes('')
    } else {
      setCarga(String(set.carga_kg ?? ''))
      setRepeticoes(String(set.repeticoes ?? ''))
      setTempoMin('')
      setCalorias('')
    }
  }

  async function registrarSerie(e) {
    e.preventDefault()
    const exercicioValido = exercicios.find((ex) => ex.id === exercicioId && ex.nome === buscaExercicio)
    if (!exercicioValido) return
    if (ehCardio ? (!tempoMin || !calorias) : (!carga || !repeticoes)) return

    const payload = ehCardio
      ? { tempo_min: parseFloat(tempoMin), calorias: parseInt(calorias, 10) }
      : { carga_kg: parseFloat(carga), repeticoes: parseInt(repeticoes, 10) }

    try {
      if (editandoId) {
        await api.updateSet({
          id: editandoId,
          numero_serie: parseInt(serieNumero, 10) || 1,
          ...payload,
        })
      } else {
        const t = await garantirTreino()
        if (!t) return
        await api.createSet({
          workout_id: t.id,
          exercise_id: exercicioId,
          numero_serie: parseInt(serieNumero, 10) || 1,
          ...payload,
        })
      }
      limparFormulario()
      carregarTreinoDoDia()
    } catch (err) {
      // silenciosamente mantém o formulário para o usuário tentar de novo
    }
  }

  async function removerSerie(id) {
    await api.deleteSet(id)
    if (editandoId === id) limparFormulario()
    carregarTreinoDoDia()
  }

  const porExercicio = series.reduce((acc, s) => {
    const chave = s.exercise_id
    if (!acc[chave]) acc[chave] = { nome: s.exercicio_nome, grupo: s.grupo_muscular, sets: [] }
    acc[chave].sets.push(s)
    return acc
  }, {})

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Treino do dia</h1>
          <p className="texto-secundario">Registre exercício, carga e séries</p>
        </div>
        <input
          type="date"
          className="entrada-data"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </header>

      <form onSubmit={registrarSerie} className="cartao form-serie">
        {editandoId && (
          <div className="aviso-edicao">
            <span>Editando série</span>
            <button type="button" className="botao-link botao-link-inline" onClick={limparFormulario}>Cancelar</button>
          </div>
        )}
        <label className="campo">
          <span>Exercício</span>
          <input
            type="text"
            list="lista-exercicios-busca"
            value={buscaExercicio}
            onChange={(e) => selecionarPorNome(e.target.value)}
            placeholder="Digite para buscar..."
            autoComplete="off"
            disabled={!!editandoId}
          />
          <datalist id="lista-exercicios-busca">
            {exercicios.map((ex) => <option key={ex.id} value={ex.nome} />)}
          </datalist>
        </label>
        {exercicioSelecionado?.gif_url && (
          <div className="preview-exercicio">
            <img
              src={exercicioSelecionado.gif_url}
              alt=""
              loading="lazy"
              onClick={() => setGifAmpliado({ url: exercicioSelecionado.gif_url, nome: exercicioSelecionado.nome })}
            />
            <p className="texto-secundario">Demonstração de {exercicioSelecionado.nome}</p>
          </div>
        )}
        <div className="linha-tres-campos">
          <label className="campo">
            <span>Série</span>
            <input inputMode="numeric" type="number" min="1" value={serieNumero} onChange={(e) => setSerieNumero(e.target.value)} placeholder="1" required />
          </label>
          {ehCardio ? (
            <>
              <label className="campo">
                <span>Tempo (min)</span>
                <input inputMode="decimal" type="number" step="0.5" min="0" value={tempoMin} onChange={(e) => setTempoMin(e.target.value)} placeholder="0" required />
              </label>
              <label className="campo">
                <span>Calorias</span>
                <input inputMode="numeric" type="number" min="0" value={calorias} onChange={(e) => setCalorias(e.target.value)} placeholder="0" required />
              </label>
            </>
          ) : (
            <>
              <label className="campo">
                <span>Carga (kg)</span>
                <input inputMode="decimal" type="number" step="0.5" min="0" value={carga} onChange={(e) => setCarga(e.target.value)} placeholder="0" required />
              </label>
              <label className="campo">
                <span>Repetições</span>
                <input inputMode="numeric" type="number" min="1" value={repeticoes} onChange={(e) => setRepeticoes(e.target.value)} placeholder="0" required />
              </label>
            </>
          )}
        </div>
        <button className="botao-primario" type="submit">{editandoId ? 'Salvar edição' : 'Registrar série'}</button>
      </form>

      {carregando ? (
        <p className="texto-secundario">Carregando...</p>
      ) : Object.keys(porExercicio).length === 0 ? (
        <p className="texto-secundario">Nenhuma série registrada neste dia ainda.</p>
      ) : (
        <div className="grupo-series">
          {Object.entries(porExercicio).map(([id, grupo]) => (
            <div key={id} className="bloco-exercicio-treino">
              <p className="nome-exercicio">{grupo.nome}</p>
              <ul className="lista-series">
                {grupo.sets.map((s) => (
                  <li key={s.id} className="linha-serie">
                    <span className="numero-serie">S{s.numero_serie}</span>
                    {s.tempo_min != null ? (
                      <>
                        <span className="valor-carga">{s.tempo_min}<small>min</small></span>
                        <span className="valor-reps">{s.calorias}<small>kcal</small></span>
                      </>
                    ) : (
                      <>
                        <span className="valor-carga">{s.carga_kg}<small>kg</small></span>
                        <span className="valor-reps">{s.repeticoes}<small>reps</small></span>
                      </>
                    )}
                    <button type="button" className="botao-editar" onClick={() => iniciarEdicao(s)} aria-label="Editar série">✎</button>
                    <button type="button" className="botao-remover" onClick={() => removerSerie(s.id)} aria-label="Remover série">×</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <VisualizadorGif gif={gifAmpliado} aoFechar={() => setGifAmpliado(null)} />
    </div>
  )
}
