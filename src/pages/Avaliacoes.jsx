import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

const CAMPOS_DETALHE = [
  { chave: 'tmb', rotulo: 'TMB', unidade: 'kcal' },
  { chave: 'rcq', rotulo: 'RCQ', unidade: '' },
  { chave: 'coxa_mm', rotulo: 'Coxa', unidade: 'mm' },
  { chave: 'escapula_mm', rotulo: 'Escápula', unidade: 'mm' },
  { chave: 'peito_mm', rotulo: 'Peito', unidade: 'mm' },
  { chave: 'abdominal_mm', rotulo: 'Abdominal', unidade: 'mm' },
  { chave: 'axila_mm', rotulo: 'Axila', unidade: 'mm' },
  { chave: 'triceps_mm', rotulo: 'Tríceps', unidade: 'mm' },
  { chave: 'suprailiaca_mm', rotulo: 'Suprailíaca', unidade: 'mm' },
]

export default function Avaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)

  const [data, setData] = useState(hoje())
  const [peso, setPeso] = useState('')
  const [gordura, setGordura] = useState('')
  const [massaMagra, setMassaMagra] = useState('')
  const [agua, setAgua] = useState('')
  const [detalhes, setDetalhes] = useState({})

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await api.listAssessments()
      setAvaliacoes(dados ?? [])
    } catch (err) {
      setErro(err.message)
    }
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  function limpar() {
    setData(hoje())
    setPeso('')
    setGordura('')
    setMassaMagra('')
    setAgua('')
    setDetalhes({})
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const payload = {
        data,
        peso_kg: peso ? parseFloat(peso) : null,
        percentual_gordura: gordura ? parseFloat(gordura) : null,
        massa_magra_kg: massaMagra ? parseFloat(massaMagra) : null,
        agua_kg: agua ? parseFloat(agua) : null,
      }
      for (const { chave } of CAMPOS_DETALHE) {
        payload[chave] = detalhes[chave] ? parseFloat(detalhes[chave]) : null
      }
      await api.saveAssessment(payload)
      limpar()
      carregar()
    } catch (err) {
      setErro(err.message)
    }
    setSalvando(false)
  }

  async function remover(id) {
    await api.deleteAssessment(id)
    carregar()
  }

  const ordenadas = [...avaliacoes].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Avaliações</h1>
          <p className="texto-secundario">Registre suas medições periódicas</p>
        </div>
      </header>

      <form onSubmit={salvar} className="cartao form-inline">
        <div className="linha-dois-campos">
          <label className="campo">
            <span>Data</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </label>
          <label className="campo">
            <span>Peso (kg)</span>
            <input inputMode="decimal" type="number" step="0.1" min="0" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0" required />
          </label>
        </div>
        <div className="linha-dois-campos">
          <label className="campo">
            <span>% Gordura</span>
            <input inputMode="decimal" type="number" step="0.1" min="0" value={gordura} onChange={(e) => setGordura(e.target.value)} placeholder="0" required />
          </label>
          <label className="campo">
            <span>Massa magra (kg)</span>
            <input inputMode="decimal" type="number" step="0.1" min="0" value={massaMagra} onChange={(e) => setMassaMagra(e.target.value)} placeholder="0" />
          </label>
        </div>
        <label className="campo">
          <span>Água corporal (kg)</span>
          <input inputMode="decimal" type="number" step="0.1" min="0" value={agua} onChange={(e) => setAgua(e.target.value)} placeholder="0" />
        </label>

        <button type="button" className="botao-link botao-link-inline" onClick={() => setMostrarDetalhes((v) => !v)}>
          {mostrarDetalhes ? 'Ocultar detalhes (TMB, RCQ, dobras)' : '+ Mais detalhes (TMB, RCQ, dobras)'}
        </button>

        {mostrarDetalhes && (
          <div className="grade-detalhes">
            {CAMPOS_DETALHE.map(({ chave, rotulo, unidade }) => (
              <label key={chave} className="campo">
                <span>{rotulo}{unidade && ` (${unidade})`}</span>
                <input
                  inputMode="decimal"
                  type="number"
                  step="0.1"
                  value={detalhes[chave] ?? ''}
                  onChange={(e) => setDetalhes((d) => ({ ...d, [chave]: e.target.value }))}
                  placeholder="0"
                />
              </label>
            ))}
          </div>
        )}

        {erro && <p className="mensagem-erro">{erro}</p>}

        <button className="botao-primario" type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Registrar avaliação'}
        </button>
      </form>

      {carregando ? (
        <p className="texto-secundario">Carregando...</p>
      ) : ordenadas.length === 0 ? (
        <p className="texto-secundario">Nenhuma avaliação registrada ainda.</p>
      ) : (
        <ul className="lista-historico">
          {ordenadas.map((a) => (
            <li key={a.id} className="item-historico">
              <div className="cabecalho-item-historico">
                <span className="data-historico">{formatarData(a.data)}</span>
                <span className="texto-secundario">
                  {a.peso_kg != null ? `${a.peso_kg}kg` : ''}
                  {a.percentual_gordura != null ? ` · ${a.percentual_gordura}% gordura` : ''}
                </span>
                <button type="button" className="botao-remover" onClick={() => remover(a.id)} aria-label="Remover avaliação">×</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
