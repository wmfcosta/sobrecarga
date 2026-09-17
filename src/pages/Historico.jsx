import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import LinhaSerie from '../components/LinhaSerie'

export default function Historico() {
  const [treinos, setTreinos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState(null)

  async function carregar() {
    setCarregando(true)
    const dados = await api.getHistory()
    setTreinos(dados ?? [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function removerSerie(id) {
    await api.deleteSet(id)
    carregar()
  }

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Histórico</h1>
          <p className="texto-secundario">Seus treinos anteriores</p>
        </div>
      </header>

      {carregando ? (
        <p className="texto-secundario">Carregando...</p>
      ) : treinos.length === 0 ? (
        <p className="texto-secundario">Nenhum treino registrado ainda.</p>
      ) : (
        <ul className="lista-historico">
          {treinos.map((t) => {
            const totalSeries = t.series.length
            const exerciciosUnicos = new Set(t.series.map((s) => s.exercicio_nome)).size
            const abertoAtual = aberto === t.id
            return (
              <li key={t.id} className="item-historico">
                <button className="cabecalho-item-historico" onClick={() => setAberto(abertoAtual ? null : t.id)}>
                  <span className="data-historico">{formatarData(t.data)}</span>
                  <span className="texto-secundario">{exerciciosUnicos} exercícios · {totalSeries} séries</span>
                  <span className="seta">{abertoAtual ? '−' : '+'}</span>
                </button>
                {abertoAtual && (
                  <div className="detalhe-historico">
                    {agrupar(t.series).map(([nome, sets]) => (
                      <div key={nome} className="bloco-exercicio-treino">
                        <p className="nome-exercicio">{nome}</p>
                        <ul className="lista-series">
                          {sets.map((s) => (
                            <LinhaSerie
                              key={s.id}
                              serie={s}
                              onRemover={removerSerie}
                              onAtualizado={carregar}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function agrupar(sets) {
  const map = {}
  for (const s of sets) {
    const nome = s.exercicio_nome ?? 'Exercício'
    if (!map[nome]) map[nome] = []
    map[nome].push(s)
  }
  return Object.entries(map)
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
