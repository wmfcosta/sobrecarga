import { useState } from 'react'
import { sugerirProgressao } from '../lib/duplaProgressao'

// Treino do dia gerado a partir de um dia do plano: cada exercício já vem com as
// linhas de série prescritas. O aluno preenche carga e repetições e confirma cada linha.
// No plano Avançado, cada série tem um tipo (Aquecimento, Feeder, Working, Back-off).

export const TIPOS = [
  { id: 'aquecimento', nome: 'Aquecimento' },
  { id: 'feeder', nome: 'Feeder' },
  { id: 'working', nome: 'Working' },
  { id: 'backoff', nome: 'Back-off' },
]
const NOME_TIPO = Object.fromEntries(TIPOS.map((t) => [t.id, t.nome]))

// "Feeder 2", "Working 1", "Back-off" (sem número quando só há uma do tipo)
export function rotuloDaSerie(tipos, indice) {
  const tipo = tipos[indice]
  if (!tipo) return `Série ${indice + 1}`
  const mesmos = tipos.filter((t) => t === tipo).length
  if (mesmos === 1) return NOME_TIPO[tipo]
  const ordem = tipos.slice(0, indice + 1).filter((t) => t === tipo).length
  return `${NOME_TIPO[tipo]} ${ordem}`
}

function num(v) {
  return v === '' || v == null ? null : Number(String(v).replace(',', '.'))
}

function LinhaPlano({ avancado, rotulo, tipo, alvo, nota, anterior, cargaSugerida, salva, onTipo, onSalvar, onRemover }) {
  // Linha nova do plano de progressão já vem com a carga sugerida; o aluno só confirma as repetições
  const [carga, setCarga] = useState(
    salva?.carga_kg != null ? String(Number(salva.carga_kg)) : cargaSugerida != null ? String(cargaSugerida) : '',
  )
  const [reps, setReps] = useState(salva?.repeticoes != null ? String(salva.repeticoes) : '')
  const [salvando, setSalvando] = useState(false)

  const alterada = salva
    ? num(carga) !== (salva.carga_kg != null ? Number(salva.carga_kg) : null) ||
      num(reps) !== (salva.repeticoes ?? null) ||
      (avancado && (salva.tipo_serie ?? null) !== (tipo ?? null))
    : true
  const podeSalvar = reps !== '' && Number(reps) > 0 && (carga === '' || Number(String(carga).replace(',', '.')) >= 0)

  async function salvar() {
    if (!podeSalvar || !alterada) return
    setSalvando(true)
    try {
      await onSalvar({ carga_kg: num(carga) ?? 0, repeticoes: parseInt(reps, 10) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <li className={`linha-plano${salva ? ' linha-plano-feita' : ''}${tipo ? ` linha-tipo-${tipo}` : ''}`}>
      <div className="linha-plano-grade">
        <div className="linha-plano-rotulo">
          {avancado ? (
            <select value={tipo ?? 'working'} onChange={(e) => onTipo(e.target.value)} aria-label="Tipo da série">
              {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          ) : (
            <span className="linha-plano-nome">{rotulo}</span>
          )}
          <small className="texto-secundario">
            {avancado && /\d$/.test(rotulo) && <span className="linha-plano-ordem">{rotulo.split(' ').pop()}º · </span>}
            {alvo ? `alvo ${alvo}` : ''}
            {anterior && ` · últ. ${anterior.carga_kg != null ? Number(anterior.carga_kg) : '-'}kg×${anterior.repeticoes ?? '-'}`}
          </small>
        </div>
        <input
          inputMode="decimal"
          type="number"
          step="0.5"
          min="0"
          value={carga}
          onChange={(e) => setCarga(e.target.value)}
          placeholder={anterior?.carga_kg != null ? String(Number(anterior.carga_kg)) : 'kg'}
          aria-label={`Carga (kg) - ${rotulo}`}
        />
        <input
          inputMode="numeric"
          type="number"
          min="1"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="reps"
          aria-label={`Repetições - ${rotulo}`}
        />
        <button
          type="button"
          className={`botao-linha-plano${salva && !alterada ? ' feito' : ''}`}
          onClick={salvar}
          disabled={salvando || !podeSalvar || !alterada}
          aria-label={salva && !alterada ? 'Série registrada' : 'Registrar série'}
        >
          {salvando ? '…' : salva && !alterada ? '✓' : salva ? 'Salvar' : 'OK'}
        </button>
      </div>
      {(nota || salva) && (
        <div className="linha-plano-rodape">
          {nota && <small className="linha-plano-nota">{nota}</small>}
          {salva && (
            <button type="button" className="botao-link botao-link-inline" onClick={onRemover}>remover</button>
          )}
        </div>
      )}
    </li>
  )
}

const ROTULO_ACAO = { subir: '↑ Subir', manter: '= Manter', reduzir: '↓ Reduzir', novo: 'Primeira vez:' }

function ExercicioDoPlano({ ex, avancado, series, tiposEditados, onTipo, onSalvar, onRemover, onGif }) {
  // Dupla progressão (só nos planos com degrau de carga, como "Progressão por grupo")
  const sugestao = sugerirProgressao(ex.series, ex.anterior)
  const tipos = ex.series.map((s, i) => tiposEditados[i] ?? series.find((x) => x.numero_serie === i + 1)?.tipo_serie ?? s.tipo ?? null)
  const feitas = ex.series.filter((_, i) => series.some((x) => x.numero_serie === i + 1)).length
  const extras = series.filter((x) => x.numero_serie > ex.series.length)

  return (
    <div className="cartao exercicio-plano">
      <div className="exercicio-plano-topo">
        {ex.gif_url && <img src={ex.gif_url} alt="" className="preview-exercicio-mini" onClick={() => onGif({ url: ex.gif_url, nome: ex.exercicio_nome })} />}
        <div>
          <p className="nome-exercicio">{ex.exercicio_nome}</p>
          <p className="texto-secundario">{feitas}/{ex.series.length} séries</p>
        </div>
      </div>
      {sugestao && (
        <p className={`sugestao-progressao sugestao-${sugestao.acao}`}>
          <strong>{ROTULO_ACAO[sugestao.acao]}</strong> {sugestao.texto}
        </p>
      )}
      {ex.observacoes && <p className="texto-secundario obs-plano">{ex.observacoes}</p>}
      <ul className="lista-plano">
        {ex.series.map((s, i) => {
          const salva = series.find((x) => x.numero_serie === i + 1)
          return (
            <LinhaPlano
              key={`${i}:${salva?.id ?? 'nova'}`}
              avancado={avancado}
              rotulo={rotuloDaSerie(tipos, i)}
              tipo={tipos[i]}
              alvo={s.reps}
              nota={s.nota}
              anterior={ex.anterior?.find((a) => a.numero_serie === i + 1)}
              cargaSugerida={sugestao?.carga ?? null}
              salva={salva}
              onTipo={(t) => onTipo(i, t)}
              onSalvar={(valores) => onSalvar(ex, i, tipos, valores, salva)}
              onRemover={() => onRemover(salva.id)}
            />
          )
        })}
        {extras.map((x) => (
          <li key={x.id} className="linha-plano linha-plano-feita">
            <div className="linha-plano-rodape">
              <small>Série extra {x.numero_serie}: {Number(x.carga_kg)}kg × {x.repeticoes}</small>
              <button type="button" className="botao-link botao-link-inline" onClick={() => onRemover(x.id)}>remover</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function TreinoDoPlano({ planoDia, series, onRegistrar, onAtualizar, onRemover, onTrocar, onGif }) {
  // tipos alterados pelo aluno ainda não salvos: { [exercicioId]: { [indice]: tipo } }
  const [tiposEditados, setTiposEditados] = useState({})
  const { avancado, exercicios } = planoDia
  const total = exercicios.reduce((n, ex) => n + ex.series.length, 0)
  const feitas = exercicios.reduce(
    (n, ex) => n + ex.series.filter((_, i) => series.some((s) => s.exercise_id === ex.exercise_id && s.numero_serie === i + 1)).length,
    0,
  )

  // Rótulo da próxima série a fazer (para o cronômetro de descanso)
  function proximaDepois(exIndice, serieIndice, tipos) {
    const ex = exercicios[exIndice]
    if (serieIndice + 1 < ex.series.length) return `${ex.exercicio_nome} · ${rotuloDaSerie(tipos, serieIndice + 1)}`
    const seguinte = exercicios[exIndice + 1]
    if (!seguinte) return 'Treino concluído!'
    return `${seguinte.exercicio_nome} · ${rotuloDaSerie(seguinte.series.map((s) => s.tipo), 0)}`
  }

  async function salvar(ex, indice, tipos, valores, salva) {
    const tipo_serie = avancado ? tipos[indice] ?? 'working' : null
    if (salva) {
      await onAtualizar({ id: salva.id, numero_serie: indice + 1, ...valores, ...(avancado ? { tipo_serie } : {}) })
    } else {
      const exIndice = exercicios.indexOf(ex)
      await onRegistrar(
        { exercise_id: ex.exercise_id, numero_serie: indice + 1, tipo_serie, ...valores },
        proximaDepois(exIndice, indice, tipos),
      )
    }
    setTiposEditados((atual) => {
      const copia = { ...(atual[ex.id] || {}) }
      delete copia[indice]
      return { ...atual, [ex.id]: copia }
    })
  }

  return (
    <section className="treino-do-plano">
      <div className="cartao treino-do-plano-cabecalho">
        <div>
          <p className="texto-secundario">{planoDia.plano_nome}</p>
          <p className="nome-exercicio">{planoDia.rotulo}</p>
          <div className="sugestao-barra" aria-hidden>
            <div style={{ width: `${total ? Math.round((feitas / total) * 100) : 0}%` }} />
          </div>
          <p className="texto-secundario">{feitas} de {total} séries registradas</p>
        </div>
        <button type="button" className="botao-link botao-link-inline" onClick={onTrocar}>Trocar treino</button>
      </div>

      {exercicios.map((ex) =>
        ex.exercise_id ? (
          <ExercicioDoPlano
            key={ex.id}
            ex={ex}
            avancado={avancado}
            series={series.filter((s) => s.exercise_id === ex.exercise_id)}
            tiposEditados={tiposEditados[ex.id] || {}}
            onTipo={(i, t) => setTiposEditados((atual) => ({ ...atual, [ex.id]: { ...(atual[ex.id] || {}), [i]: t } }))}
            onSalvar={salvar}
            onRemover={onRemover}
            onGif={onGif}
          />
        ) : (
          <div key={ex.id} className="cartao">
            <p className="nome-exercicio">{ex.exercicio_nome}</p>
            <p className="texto-secundario">Exercício não encontrado no cadastro.</p>
          </div>
        ),
      )}
    </section>
  )
}
