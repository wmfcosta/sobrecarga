import { api } from './api'

// Inscreve este aparelho para receber notificações do servidor (Web Push).
// Android: funciona no Chrome. iPhone: só com o app instalado na tela inicial (iOS 16.4+).

function base64ParaBytes(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const bruto = atob(b64)
  return Uint8Array.from([...bruto].map((c) => c.charCodeAt(0)))
}

export function pushSuportado() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined'
}

let inscritoNestaSessao = false

// Precisa da permissão já concedida. Retorna true se o aparelho está inscrito.
export async function garantirInscricaoPush() {
  if (!pushSuportado() || Notification.permission !== 'granted') return false
  if (inscritoNestaSessao) return true
  try {
    const { chave } = await api.pushChave()
    if (!chave) return false
    const reg = await navigator.serviceWorker.ready
    let inscricao = await reg.pushManager.getSubscription()
    if (!inscricao) {
      inscricao = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ParaBytes(chave) })
    }
    await api.pushInscrever(inscricao.toJSON())
    inscritoNestaSessao = true
    return true
  } catch {
    return false
  }
}

// Pede permissão (precisa vir de um toque do usuário) e inscreve o aparelho
export async function ativarNotificacoes() {
  if (!pushSuportado()) return { ok: false, motivo: 'nao-suportado' }
  let permissao = Notification.permission
  if (permissao === 'default') permissao = await Notification.requestPermission()
  if (permissao !== 'granted') return { ok: false, motivo: 'negado' }
  const ok = await garantirInscricaoPush()
  return ok ? { ok: true } : { ok: false, motivo: 'falha' }
}
