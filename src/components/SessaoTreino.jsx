import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const INTENSIDADES = [
  { valor: 'normal', rotulo: 'Normal' },
  { valor: 'moderado', rotulo: 'Moderado' },
  { valor: 'pesado', rotulo: 'Pesado' },
  { valor: 'desafiador', rotulo: 'Desafiador' },
]

function rotuloIntensidade(valor) {
  return INTENSIDADES.find((i) => i.valor === valor)?.rotulo ?? valor
}

function formatarDecorrido(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function formatarDuracao(min) {
  if (min == null) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

// Botões de iniciar/finalizar o treino do dia e resumo da sessão
export default function SessaoTreino({ treino, data, ehHoje, onAtualizar }) {
  const [agora, setAgora] = useState(() => Date.now())
  const [modal, setModal] = useState(null) // 'finalizar' | 'editar' | null
  const [duracao, setDuracao] = useState('')
  const [calorias, setCalorias] = useState('')
  const [intensidade, setIntensidade] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const iniciado = !!treino?.inicio_em
  const finalizado = !!treino?.fim_em
  const emAndamento = iniciado && !finalizado
  const decorridoMs = iniciado ? agora - new Date(treino.inicio_em).getTime() : 0

  useEffect(() => {
    if (!emAndamento) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [emAndamento])

  async function executar(fn) {
    setEnviando(true)
    setErro('')
    try {
      const atualizado = await fn()
      onAtualizar(atualizado)
      return true
    } catch (e) {
      setErro(e.message)
      return false
    } finally {
      setEnviando(false)
    }
  }

  function abrirModal(tipo) {
    setErro('')
    if (tipo === 'finalizar') {
      setDuracao(String(Math.max(1, Math.round((Date.now() - new Date(treino.inicio_em).getTime()) / 60000))))
      setCalorias('')
      setIntensidade('')
    } else {
      setDuracao(treino.duracao_min != null ? String(treino.duracao_min) : '')
      setCalorias(treino.calorias_total != null ? String(treino.calorias_total) : '')
      setIntensidade(treino.intensidade ?? '')
    }
    setModal(tipo)
  }

  async function salvar(e) {
    e.preventDefault()
    if (!intensidade) { setErro('Escolha a intensidade do treino.'); return }
    const payload = {
      workout_id: treino.id,
      calorias: calorias === '' ? null : Number(calorias),
      intensidade,
      duracao_min: duracao === '' ? null : Number(duracao),
    }
    const ok = await executar(() => (modal === 'finalizar' ? api.finalizarTreino(payload) : api.editarTreino(payload)))
    if (ok) setModal(null)
  }

  // Dias passados: só mostra o resumo, se o treino foi finalizado
  if (!ehHoje && !finalizado) return null

  return (
    <>
      <section className={`cartao sessao-treino${emAndamento ? ' sessao-ativa' : ''}`}>
        {!iniciado && (
          <>
            <div className="sessao-info">
              <p className="nome-exercicio">Pronto para treinar?</p>
              <p className="texto-secundario">O tempo do treino começa a contar ao iniciar.</p>
            </div>
            <button type="button" className="botao-primario" disabled={enviando}
              onClick={() => executar(() => api.iniciarTreino(data))}>
              {enviando ? 'Iniciando...' : 'Iniciar treino'}
            </button>
          </>
        )}

        {emAndamento && (
          <>
            <div className="sessao-info">
              <p className="sessao-rotulo">Treino em andamento</p>
              <p className="sessao-cronometro">{formatarDecorrido(decorridoMs)}</p>
            </div>
            <button type="button" className="botao-secundario" onClick={() => abrirModal('finalizar')}>
              Finalizar treino
            </button>
          </>
        )}

        {finalizado && (
          <>
            <div className="sessao-info">
              <p className="sessao-rotulo">Treino finalizado</p>
              <p className="sessao-resumo">
                {formatarDuracao(treino.duracao_min)}
                {treino.calorias_total != null && <> · {treino.calorias_total} kcal</>}
                {treino.intensidade && <> · {rotuloIntensidade(treino.intensidade)}</>}
              </p>
            </div>
            <div className="sessao-acoes">
              <button type="button" className="botao-mini" onClick={() => abrirModal('editar')}>Editar</button>
              {ehHoje && (
                <button type="button" className="botao-mini" disabled={enviando}
                  onClick={() => executar(() => api.retomarTreino(treino.id))}>
                  Retomar
                </button>
              )}
            </div>
          </>
        )}
        {erro && !modal && <p className="mensagem-erro">{erro}</p>}
      </section>

      {modal && (
        <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="titulo-finalizar"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <form className="modal-cartao" onSubmit={salvar}>
            <h2 id="titulo-finalizar">{modal === 'finalizar' ? 'Finalizar treino' : 'Editar treino'}</h2>

            <label className="campo">
              <span>Duração (min)</span>
              <input type="number" inputMode="numeric" min="1" max="600" value={duracao}
                onChange={(e) => setDuracao(e.target.value)} required />
              <small className="texto-secundario">Calculada automaticamente; ajuste se esqueceu de finalizar na hora.</small>
            </label>

            <label className="campo">
              <span>Calorias gastas (kcal)</span>
              <input type="number" inputMode="numeric" min="0" max="5000" value={calorias}
                onChange={(e) => setCalorias(e.target.value)} placeholder="ex.: 350" required autoFocus />
            </label>

            <fieldset className="campo campo-intensidade">
              <legend>Como foi o treino?</legend>
              <div className="opcoes-intensidade">
                {INTENSIDADES.map((i) => (
                  <button type="button" key={i.valor}
                    className={`chip${intensidade === i.valor ? ' chip-ativo' : ''}`}
                    aria-pressed={intensidade === i.valor}
                    onClick={() => setIntensidade(i.valor)}>
                    {i.rotulo}
                  </button>
                ))}
              </div>
            </fieldset>

            {erro && <p className="mensagem-erro">{erro}</p>}

            <div className="modal-acoes">
              <button type="button" className="botao-mini" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="botao-primario" disabled={enviando}>
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
