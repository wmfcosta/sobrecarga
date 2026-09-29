import { useState } from 'react'
import { api } from '../lib/api'
import { ativarNotificacoes, pushSuportado } from '../lib/push'

const ehIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

export default function CartaoNotificacoes() {
  const [estado, setEstado] = useState('')
  const [testando, setTestando] = useState(false)

  async function testar() {
    setTestando(true)
    setEstado('')
    try {
      const r = await ativarNotificacoes()
      if (!r.ok) {
        if (r.motivo === 'nao-suportado') {
          setEstado(ehIOS
            ? 'No iPhone, as notificações só funcionam com o app instalado: no Safari, toque em Compartilhar → "Adicionar à Tela de Início" e abra o Sobrecarga pelo ícone.'
            : 'Este navegador não suporta notificações. Use o Chrome.')
        } else if (r.motivo === 'negado') {
          setEstado('As notificações estão bloqueadas. Libere nas configurações do celular (Notificações → Sobrecarga) e tente de novo.')
        } else {
          setEstado('Não foi possível ativar as notificações neste aparelho. Tente de novo em instantes.')
        }
        return
      }
      const { enviados } = await api.pushTeste()
      setEstado(enviados > 0
        ? 'Pronto! Uma notificação de teste foi enviada. Nos descansos você será avisado 5 segundos antes e no fim.'
        : 'O aparelho foi inscrito, mas o envio falhou. Tente de novo.')
    } catch (e) {
      setEstado(e.message)
    } finally {
      setTestando(false)
    }
  }

  return (
    <div className="cartao form-inline">
      <p className="nome-exercicio">Notificações do descanso</p>
      <p className="texto-secundario">
        Com as notificações ativadas, o celular avisa quando faltarem 5 segundos e quando o descanso acabar,
        mesmo com a tela bloqueada.
        {ehIOS && ' No iPhone, é preciso usar o app instalado na tela inicial.'}
      </p>
      {estado && <p className="aviso-edicao">{estado}</p>}
      <button type="button" className="botao-secundario" onClick={testar} disabled={testando || (!pushSuportado() && !ehIOS)}>
        {testando ? 'Enviando...' : 'Ativar e testar notificação'}
      </button>
    </div>
  )
}
