import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function DiaDoPlano({ dia }) {
  return (
    <div className="cartao bloco-exercicio-treino">
      <p className="nome-exercicio">{dia.rotulo}</p>
      <ul className="lista-series">
        {dia.exercicios.map((ex, i) => (
          <li key={ex.id ?? i} className="item-plano">
            <div className="linha-serie">
              <span className="nome-plano">{ex.exercicio_nome}</span>
              <span className="valor-carga">{ex.series_alvo ?? '-'}<small>séries</small></span>
              <span className="valor-reps">{ex.repeticoes_alvo ?? '-'}<small>reps</small></span>
              {ex.carga_alvo_kg != null && <span className="valor-carga">{ex.carga_alvo_kg}<small>kg</small></span>}
            </div>
            {ex.observacoes && <p className="texto-secundario obs-plano">{ex.observacoes}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Plano() {
  const [plano, setPlano] = useState(undefined) // undefined = carregando, null = sem plano
  const [modelos, setModelos] = useState([])
  const [modeloAberto, setModeloAberto] = useState(null)
  const [diaSelecionado, setDiaSelecionado] = useState(0)
  const [confirmando, setConfirmando] = useState(null)
  const [ativando, setAtivando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.getMyPlan().then(setPlano).catch(() => setPlano(null))
    api.getPlanTemplates().then(setModelos).catch(() => setModelos([]))
  }, [])

  async function ativar(modelo) {
    setAtivando(true)
    setErro('')
    try {
      const novo = await api.activatePlanTemplate(modelo.id)
      setPlano(novo)
      setConfirmando(null)
      setModeloAberto(null)
      setAviso(
        novo.exercicios_criados > 0
          ? `Plano "${novo.nome}" ativado. ${novo.exercicios_criados} exercício(s) novo(s) adicionados ao cadastro.`
          : `Plano "${novo.nome}" ativado.`,
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setErro(e.message)
    } finally {
      setAtivando(false)
    }
  }

  const aberto = modelos.find((m) => m.id === modeloAberto)

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Meu plano</h1>
          <p className="texto-secundario">Referência de treino: exercícios, séries e repetições</p>
        </div>
      </header>

      {aviso && <p className="aviso-edicao">{aviso}</p>}

      {plano === undefined ? (
        <p className="texto-secundario">Carregando...</p>
      ) : plano === null ? (
        <p className="texto-secundario">
          Você ainda não tem um plano ativo. Escolha um dos planos disponíveis abaixo ou continue
          registrando seus treinos normalmente.
        </p>
      ) : (
        <>
          <div className="cartao">
            <p className="nome-exercicio">{plano.nome}</p>
            {plano.personal_nome && <p className="texto-secundario">Prescrito por {plano.personal_nome}</p>}
          </div>

          {plano.dias.map((dia) => <DiaDoPlano key={dia.id} dia={dia} />)}

          <p className="texto-secundario">
            Isto é referência. Para registrar o que você realmente fez, use a tela de Treino.
          </p>
        </>
      )}

      {modelos.length > 0 && (
        <section className="secao-modelos">
          <h2>Planos disponíveis</h2>
          {modelos.map((modelo) => {
            const ehAtual = plano?.nome === modelo.nome
            return (
              <div key={modelo.id} className="cartao modelo-plano">
                <p className="nome-exercicio">{modelo.nome}{ehAtual && <span className="chip chip-ativo selo-atual">Ativo</span>}</p>
                <p className="texto-secundario">{modelo.descricao}</p>
                <div className="modal-acoes">
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => { setModeloAberto(modeloAberto === modelo.id ? null : modelo.id); setDiaSelecionado(0) }}
                  >
                    {modeloAberto === modelo.id ? 'Ocultar exercícios' : 'Ver exercícios'}
                  </button>
                  {!ehAtual && (
                    <button type="button" className="botao-primario" onClick={() => setConfirmando(modelo)}>
                      Ativar este plano
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {aberto && (
            <>
              <div className="filtros-chip">
                {aberto.dias.map((dia, i) => (
                  <button
                    key={dia.rotulo}
                    type="button"
                    className={`chip ${i === diaSelecionado ? 'chip-ativo' : ''}`}
                    onClick={() => setDiaSelecionado(i)}
                  >
                    {dia.rotulo.split(' - ')[0]}
                  </button>
                ))}
              </div>
              <DiaDoPlano dia={aberto.dias[diaSelecionado]} />
            </>
          )}
        </section>
      )}

      {confirmando && (
        <div className="modal-fundo" onClick={() => !ativando && setConfirmando(null)}>
          <div className="modal-cartao" onClick={(e) => e.stopPropagation()}>
            <h2>Ativar "{confirmando.nome}"?</h2>
            {plano ? (
              <p className="texto-secundario">
                Ele substitui o seu plano atual ("{plano.nome}"). Seu histórico de treinos não é alterado.
              </p>
            ) : (
              <p className="texto-secundario">O plano aparecerá nesta tela como referência para seus treinos.</p>
            )}
            <p className="texto-secundario">
              Exercícios do plano que ainda não existem no cadastro serão adicionados automaticamente.
            </p>
            {erro && <p className="mensagem-erro">{erro}</p>}
            <div className="modal-acoes">
              <button type="button" className="botao-secundario" disabled={ativando} onClick={() => setConfirmando(null)}>
                Cancelar
              </button>
              <button type="button" className="botao-primario" disabled={ativando} onClick={() => ativar(confirmando)}>
                {ativando ? 'Ativando...' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
