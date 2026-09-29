// Notificações do cronômetro de descanso (Web Push).
//
// Fluxo: o celular se inscreve (push_subscriptions). Ao iniciar um descanso, a
// página chama /api/profile?push=descanso com o horário de término. O servidor
// responde na hora e, em segundo plano (waitUntil), espera até faltar 5s para
// mandar "Faltam 5 segundos" e depois "Descanso encerrado". Cada descanso tem um
// token: pular ou somar +30s troca o token, e o envio antigo desiste sozinho.
// Uma função pode rodar no máximo ~300s; descansos maiores continuam numa nova
// chamada (encadeamento) antes do limite.

import crypto from 'crypto'
import webpush from 'web-push'
import { sql } from './db.js'

const AVISO_ANTECIPADO_MS = 5000
const LIMITE_EXECUCAO_MS = Number(process.env.PUSH_LIMITE_MS) || 270 * 1000

let tabelasProntas = false
async function garantirTabelas() {
  if (tabelasProntas) return
  await sql`create table if not exists push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    endpoint text unique not null,
    p256dh text not null,
    auth text not null,
    created_at timestamptz not null default now()
  )`
  await sql`alter table users add column if not exists descanso_fim_em timestamptz`
  await sql`alter table users add column if not exists descanso_token text`
  tabelasProntas = true
}

export function pushConfigurado() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

function configurarVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'https://musculacao-wm-consultoria.vercel.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

// Segredo interno para o encadeamento (derivado da DATABASE_URL, como o token de login)
export function segredoInterno() {
  return crypto.createHash('sha256').update('push:' + (process.env.DATABASE_URL || '')).digest('hex')
}

export async function salvarInscricao(userId, inscricao) {
  await garantirTabelas()
  const { endpoint, keys } = inscricao || {}
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    const erro = new Error('Inscrição de notificação inválida.')
    erro.status = 400
    throw erro
  }
  await sql`
    insert into push_subscriptions (user_id, endpoint, p256dh, auth)
    values (${userId}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
    on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
}

export async function enviarParaUsuario(userId, payload) {
  await garantirTabelas()
  configurarVapid()
  const inscricoes = await sql`select id, endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}`
  let enviados = 0
  await Promise.all(
    inscricoes.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60, urgency: 'high', topic: 'descanso' },
        )
        enviados++
      } catch (err) {
        // 404/410: inscrição expirada ou app desinstalado
        if (err.statusCode === 404 || err.statusCode === 410) {
          await sql`delete from push_subscriptions where id = ${s.id}`
        }
      }
    }),
  )
  return enviados
}

// Registra o descanso e devolve o token que identifica este agendamento
export async function registrarDescanso(userId, fimEm) {
  await garantirTabelas()
  const token = crypto.randomUUID()
  await sql`update users set descanso_fim_em = ${new Date(fimEm).toISOString()}, descanso_token = ${token} where id = ${userId}`
  return token
}

export async function cancelarDescanso(userId) {
  await garantirTabelas()
  await sql`update users set descanso_fim_em = null, descanso_token = null where id = ${userId}`
}

async function aindaValido(userId, token) {
  const linhas = await sql`select descanso_token from users where id = ${userId}`
  return linhas[0]?.descanso_token === token
}

const dormir = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)))

// Espera e envia os avisos. Se o término passar do limite desta execução,
// chama `continuar()` perto do limite para uma nova execução seguir daí.
export async function executarAgendamento({ userId, token, fimEm, corpo, avisoEnviado = false, continuar }) {
  const inicio = Date.now()
  const prazo = inicio + LIMITE_EXECUCAO_MS
  const etapas = []
  if (!avisoEnviado && fimEm - AVISO_ANTECIPADO_MS > Date.now() + 1000) {
    etapas.push({ em: fimEm - AVISO_ANTECIPADO_MS, tipo: 'aviso' })
  }
  etapas.push({ em: fimEm, tipo: 'fim' })

  for (const etapa of etapas) {
    if (etapa.em > prazo) {
      await dormir(prazo - Date.now())
      if (await aindaValido(userId, token)) {
        await continuar({ userId, token, fimEm, corpo, avisoEnviado: etapa.tipo === 'fim' })
      }
      return
    }
    await dormir(etapa.em - Date.now())
    if (!(await aindaValido(userId, token))) return
    if (etapa.tipo === 'aviso') {
      await enviarParaUsuario(userId, {
        tipo: 'descanso-aviso',
        titulo: 'Faltam 5 segundos ⏱️',
        corpo: corpo || 'Prepare-se para a próxima série',
      })
    } else {
      await enviarParaUsuario(userId, {
        tipo: 'descanso-fim',
        titulo: 'Descanso encerrado 💪',
        corpo: corpo || 'Hora da próxima série!',
      })
      await sql`update users set descanso_fim_em = null, descanso_token = null where id = ${userId} and descanso_token = ${token}`
    }
  }
}
