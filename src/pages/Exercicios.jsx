import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const GRUPOS = ['Peito', 'Costas', 'Pernas', 'Ombro', 'Bíceps', 'Tríceps', 'Abdômen', 'Panturrilha', 'Posterior/Costas', 'Cardio', 'Outro']

export default function Exercicios() {
  const [exercicios, setExercicios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('Todos')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [grupo, setGrupo] = useState(GRUPOS[0])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    const data = await api.listExercises()
    setExercicios(data ?? [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function adicionarExercicio(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    setErro('')
    try {
      await api.createExercise(nome.trim(), grupo)
      setNome('')
      setMostrarForm(false)
      carregar()
    } catch (err) {
      setErro(err.message)
    }
    setSalvando(false)
  }

  const grupos = ['Todos', ...new Set(exercicios.map((ex) => ex.grupo_muscular).filter(Boolean))]
  const listaFiltrada = filtro === 'Todos' ? exercicios : exercicios.filter((ex) => ex.grupo_muscular === filtro)

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Exercícios</h1>
          <p className="texto-secundario">{exercicios.length} disponíveis para registro</p>
        </div>
        <button className="botao-primario botao-compacto" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Fechar' : '+ Novo'}
        </button>
      </header>

      {mostrarForm && (
        <form onSubmit={adicionarExercicio} className="cartao form-inline">
          <label className="campo">
            <span>Nome do exercício</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Supino reto" required />
          </label>
          <label className="campo">
            <span>Grupo muscular</span>
            <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
              {GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          {erro && <p className="mensagem-erro">{erro}</p>}
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Adicionar exercício'}
          </button>
        </form>
      )}

      <div className="filtros-chip">
        {grupos.map((g) => (
          <button key={g} className={`chip ${filtro === g ? 'chip-ativo' : ''}`} onClick={() => setFiltro(g)}>
            {g}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="texto-secundario">Carregando...</p>
      ) : listaFiltrada.length === 0 ? (
        <p className="texto-secundario">Nenhum exercício neste grupo ainda.</p>
      ) : (
        <ul className="lista-exercicios">
          {listaFiltrada.map((ex) => (
            <li key={ex.id} className="item-exercicio">
              <span className="marcador-grupo" aria-hidden />
              <div>
                <p className="nome-exercicio">{ex.nome}</p>
                <p className="texto-secundario">{ex.grupo_muscular}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
