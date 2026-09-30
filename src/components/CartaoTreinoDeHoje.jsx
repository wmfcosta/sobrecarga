import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { dataLocalISO } from '../lib/datas'

function letra(rotulo) {
  return rotulo.split(' - ')[0]
}

function dataCurta(iso) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

// Transforma um dia do plano ativo no treino de hoje
export default function CartaoTreinoDeHoje({ plano }) {
  const navigate = useNavigate()
  const sugerido = plano.proximo_dia_id ?? plano.dias[0]?.id
  const [diaId, setDiaId] = useState(sugerido)
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const hoje = dataLocalISO()
  const dia = plano.dias.find((d) => d.id === diaId)
  const ultimoDia = plano.ultimo_uso && plano.dias.find((d) => d.id === plano.ultimo_uso.plan_day_id)

  async function confirmar() {
    setEnviando(true)
    setErro('')
    try {
      await api.usarPlanoNoDia(hoje, diaId)
      navigate('/')
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
    }
  }

  if (!dia) return null

  return (
    <div className="cartao treino-de-hoje">
      <p className="nome-exercicio">Treino de hoje</p>
      <p className="texto-secundario">
        {ultimoDia
          ? `Último treino do plano: ${letra(ultimoDia.rotulo)} em ${dataCurta(plano.ultimo_uso.data)}. Sugerido agora: ${letra(plano.dias.find((d) => d.id === sugerido)?.rotulo ?? '')}.`
          : 'Escolha qual treino do plano você vai fazer hoje.'}
      </p>
      <div className="filtros-chip">
        {plano.dias.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`chip ${d.id === diaId ? 'chip-ativo' : ''}`}
            onClick={() => setDiaId(d.id)}
          >
            {letra(d.rotulo).replace(/^Treino\s+/i, '')}
          </button>
        ))}
      </div>
      <p className="texto-secundario">{dia.rotulo} · {dia.exercicios.length} exercícios</p>
      <button type="button" className="botao-primario" onClick={() => setConfirmando(true)}>
        Usar como treino de hoje
      </button>

      {confirmando && (
        <div className="modal-fundo" onClick={() => !enviando && setConfirmando(false)}>
          <div className="modal-cartao" onClick={(e) => e.stopPropagation()}>
            <h2>Treinar "{dia.rotulo}" hoje?</h2>
            <p className="texto-secundario">
              A tela de Treino de hoje ({dataCurta(hoje)}) vai mostrar os {dia.exercicios.length} exercícios deste treino
              com as séries prontas. Você só preenche a carga e as repetições.
            </p>
            <p className="texto-secundario">Séries que você já registrou hoje continuam salvas.</p>
            {erro && <p className="mensagem-erro">{erro}</p>}
            <div className="modal-acoes">
              <button type="button" className="botao-secundario" disabled={enviando} onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
              <button type="button" className="botao-primario" disabled={enviando} onClick={confirmar}>
                {enviando ? 'Preparando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
