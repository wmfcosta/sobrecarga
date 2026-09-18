import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function novoExercicio() {
  return { exercicio_nome: '', series_alvo: '', repeticoes_alvo: '', carga_alvo_kg: '', observacoes: '' }
}

function novoDia(letra) {
  return { rotulo: `Treino ${letra}`, exercicios: [novoExercicio()] }
}

export default function Prescricao() {
  const [alunos, setAlunos] = useState([])
  const [exercicios, setExercicios] = useState([])
  const [alunoId, setAlunoId] = useState('')
  const [planoAtual, setPlanoAtual] = useState(undefined)
  const [nome, setNome] = useState('')
  const [dias, setDias] = useState([novoDia('A')])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    api.listStudents().then(setAlunos).catch((err) => setErro(err.message))
    api.listExercises().then(setExercicios).catch(() => setExercicios([]))
  }, [])

  useEffect(() => {
    if (!alunoId) {
      setPlanoAtual(undefined)
      return
    }
    setPlanoAtual(undefined)
    api.getStudentPlan(alunoId).then(setPlanoAtual).catch(() => setPlanoAtual(null))
  }, [alunoId])

  function atualizarRotulo(i, rotulo) {
    setDias((d) => d.map((dia, idx) => (idx === i ? { ...dia, rotulo } : dia)))
  }

  function adicionarDia() {
    setDias((d) => [...d, novoDia(String.fromCharCode(65 + d.length))])
  }

  function removerDia(i) {
    setDias((d) => d.filter((_, idx) => idx !== i))
  }

  function adicionarExercicio(i) {
    setDias((d) => d.map((dia, idx) => (idx === i ? { ...dia, exercicios: [...dia.exercicios, novoExercicio()] } : dia)))
  }

  function removerExercicio(i, j) {
    setDias((d) => d.map((dia, idx) => (idx === i ? { ...dia, exercicios: dia.exercicios.filter((_, k) => k !== j) } : dia)))
  }

  function atualizarExercicio(i, j, campo, valor) {
    setDias((d) =>
      d.map((dia, idx) =>
        idx === i
          ? { ...dia, exercicios: dia.exercicios.map((ex, k) => (k === j ? { ...ex, [campo]: valor } : ex)) }
          : dia
      )
    )
  }

  async function salvar(e) {
    e.preventDefault()
    if (!alunoId || !nome.trim()) {
      setErro('Selecione o aluno e dê um nome ao plano.')
      return
    }
    setSalvando(true)
    setErro('')
    setSucesso(false)
    try {
      const plano = await api.savePlan({ aluno_id: alunoId, nome, dias })
      setPlanoAtual(plano)
      setNome('')
      setDias([novoDia('A')])
      setSucesso(true)
    } catch (err) {
      setErro(err.message)
    }
    setSalvando(false)
  }

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Prescrever treino</h1>
          <p className="texto-secundario">Monte o ciclo de treinos do aluno</p>
        </div>
      </header>

      <div className="cartao form-inline">
        <label className="campo">
          <span>Aluno</span>
          <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
            <option value="">Selecione um aluno</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </label>

        {alunoId && planoAtual === undefined && (
          <p className="texto-secundario">Carregando plano atual...</p>
        )}
        {alunoId && planoAtual && (
          <p className="texto-secundario">
            Este aluno já tem um plano ativo ("{planoAtual.nome}"). Salvar um novo plano substitui o
            atual; o anterior fica preservado no histórico.
          </p>
        )}
      </div>

      {alunoId && (
        <form onSubmit={salvar} className="cartao form-inline">
          <label className="campo">
            <span>Nome do plano</span>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Hipertrofia - Fase 1" />
          </label>

          <datalist id="lista-exercicios-prescricao">
            {exercicios.map((ex) => <option key={ex.id} value={ex.nome} />)}
          </datalist>

          {dias.map((dia, i) => (
            <div key={i} className="cartao">
              <div className="linha-dois-campos">
                <label className="campo">
                  <span>Rótulo do dia</span>
                  <input type="text" value={dia.rotulo} onChange={(e) => atualizarRotulo(i, e.target.value)} />
                </label>
                {dias.length > 1 && (
                  <button type="button" className="botao-link botao-link-inline" onClick={() => removerDia(i)}>
                    Remover dia
                  </button>
                )}
              </div>

              {dia.exercicios.map((ex, j) => (
                <div key={j} className="linha-tres-campos">
                  <label className="campo">
                    <span>Exercício</span>
                    <input
                      type="text"
                      list="lista-exercicios-prescricao"
                      value={ex.exercicio_nome}
                      onChange={(e) => atualizarExercicio(i, j, 'exercicio_nome', e.target.value)}
                      placeholder="Digite para buscar..."
                      autoComplete="off"
                    />
                  </label>
                  <label className="campo">
                    <span>Séries</span>
                    <input inputMode="numeric" type="number" min="1" value={ex.series_alvo} onChange={(e) => atualizarExercicio(i, j, 'series_alvo', e.target.value)} />
                  </label>
                  <label className="campo">
                    <span>Reps</span>
                    <input type="text" placeholder="8-12" value={ex.repeticoes_alvo} onChange={(e) => atualizarExercicio(i, j, 'repeticoes_alvo', e.target.value)} />
                  </label>
                  <label className="campo">
                    <span>Carga (kg)</span>
                    <input inputMode="decimal" type="number" step="0.5" min="0" value={ex.carga_alvo_kg} onChange={(e) => atualizarExercicio(i, j, 'carga_alvo_kg', e.target.value)} />
                  </label>
                  <button type="button" className="botao-remover" aria-label="Remover exercício" onClick={() => removerExercicio(i, j)}>×</button>
                </div>
              ))}

              <button type="button" className="botao-link botao-link-inline" onClick={() => adicionarExercicio(i)}>
                + Adicionar exercício
              </button>
            </div>
          ))}

          <button type="button" className="botao-link botao-link-inline" onClick={adicionarDia}>
            + Adicionar dia de treino
          </button>

          {erro && <p className="mensagem-erro">{erro}</p>}
          {sucesso && <p className="texto-secundario">Plano salvo com sucesso.</p>}

          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar plano'}
          </button>
        </form>
      )}
    </div>
  )
}
