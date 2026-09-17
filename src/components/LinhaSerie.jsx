import { useState } from 'react'
import { api } from '../lib/api'

export default function LinhaSerie({ serie, editavel = true, onRemover, onAtualizado }) {
  const ehCardio = serie.tempo_min != null
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [numeroSerie, setNumeroSerie] = useState(String(serie.numero_serie ?? 1))
  const [carga, setCarga] = useState(serie.carga_kg != null ? String(serie.carga_kg) : '')
  const [repeticoes, setRepeticoes] = useState(serie.repeticoes != null ? String(serie.repeticoes) : '')
  const [tempoMin, setTempoMin] = useState(serie.tempo_min != null ? String(serie.tempo_min) : '')
  const [calorias, setCalorias] = useState(serie.calorias != null ? String(serie.calorias) : '')

  function cancelar() {
    setNumeroSerie(String(serie.numero_serie ?? 1))
    setCarga(serie.carga_kg != null ? String(serie.carga_kg) : '')
    setRepeticoes(serie.repeticoes != null ? String(serie.repeticoes) : '')
    setTempoMin(serie.tempo_min != null ? String(serie.tempo_min) : '')
    setCalorias(serie.calorias != null ? String(serie.calorias) : '')
    setEditando(false)
  }

  async function salvar() {
    setSalvando(true)
    const payload = ehCardio
      ? { tempo_min: parseFloat(tempoMin), calorias: parseInt(calorias, 10) }
      : { carga_kg: parseFloat(carga), repeticoes: parseInt(repeticoes, 10) }
    try {
      await api.updateSet({
        id: serie.id,
        numero_serie: parseInt(numeroSerie, 10) || 1,
        ...payload,
      })
      setEditando(false)
      onAtualizado?.()
    } catch (err) {
      // mantém em edição para o usuário tentar novamente
    }
    setSalvando(false)
  }

  if (editando) {
    return (
      <li className="linha-serie-edicao">
        <label className="campo-mini">
          <span>Série</span>
          <input type="number" min="1" inputMode="numeric" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
        </label>
        {ehCardio ? (
          <>
            <label className="campo-mini">
              <span>Min</span>
              <input type="number" step="0.5" min="0" inputMode="decimal" value={tempoMin} onChange={(e) => setTempoMin(e.target.value)} />
            </label>
            <label className="campo-mini">
              <span>Kcal</span>
              <input type="number" min="0" inputMode="numeric" value={calorias} onChange={(e) => setCalorias(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label className="campo-mini">
              <span>Kg</span>
              <input type="number" step="0.5" min="0" inputMode="decimal" value={carga} onChange={(e) => setCarga(e.target.value)} />
            </label>
            <label className="campo-mini">
              <span>Reps</span>
              <input type="number" min="1" inputMode="numeric" value={repeticoes} onChange={(e) => setRepeticoes(e.target.value)} />
            </label>
          </>
        )}
        <div className="acoes-edicao">
          <button type="button" className="botao-mini botao-mini-salvar" onClick={salvar} disabled={salvando}>
            {salvando ? '...' : 'Salvar'}
          </button>
          <button type="button" className="botao-mini" onClick={cancelar}>Cancelar</button>
        </div>
      </li>
    )
  }

  return (
    <li className="linha-serie">
      <span className="numero-serie">S{serie.numero_serie}</span>
      {ehCardio ? (
        <>
          <span className="valor-carga">{serie.tempo_min}<small>min</small></span>
          <span className="valor-reps">{serie.calorias}<small>kcal</small></span>
        </>
      ) : (
        <>
          <span className="valor-carga">{serie.carga_kg}<small>kg</small></span>
          <span className="valor-reps">{serie.repeticoes}<small>reps</small></span>
        </>
      )}
      {editavel && (
        <div className="acoes-serie">
          <button type="button" className="botao-icone" onClick={() => setEditando(true)} aria-label="Editar série">Editar</button>
          {onRemover && (
            <button type="button" className="botao-remover" onClick={() => onRemover(serie.id)} aria-label="Remover série">×</button>
          )}
        </div>
      )}
    </li>
  )
}
