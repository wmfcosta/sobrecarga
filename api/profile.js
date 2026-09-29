import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'
import { waitUntil } from '@vercel/functions'
import {
  pushConfigurado, segredoInterno, salvarInscricao, enviarParaUsuario,
  registrarDescanso, cancelarDescanso, executarAgendamento,
} from './_lib/push.js'

// Dispara a próxima etapa do agendamento numa nova execução (descansos longos)
function criarContinuacao(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return async (estado) => {
    await fetch(`${proto}://${host}/api/profile?push=continuar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-push-segredo': segredoInterno() },
      body: JSON.stringify(estado),
    }).catch(() => {})
  }
}

// Rotas de notificação (Web Push) do cronômetro de descanso: /api/profile?push=...
async function tratarPush(req, res) {
  const acao = req.query.push

  if (acao === 'continuar') {
    if (req.method !== 'POST' || req.headers['x-push-segredo'] !== segredoInterno()) {
      return res.status(401).json({ error: 'Não autorizado' })
    }
    const estado = req.body || {}
    waitUntil(executarAgendamento({ ...estado, continuar: criarContinuacao(req) }))
    return res.status(202).json({ ok: true })
  }

  const userId = requireAuth(req)

  if (acao === 'chave') {
    return res.status(200).json({ chave: pushConfigurado() ? process.env.VAPID_PUBLIC_KEY : null })
  }
  if (!pushConfigurado()) return res.status(503).json({ error: 'Notificações não configuradas no servidor.' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (acao === 'inscrever') {
    await salvarInscricao(userId, req.body?.inscricao)
    return res.status(200).json({ ok: true })
  }

  if (acao === 'teste') {
    const enviados = await enviarParaUsuario(userId, {
      tipo: 'teste',
      titulo: 'Notificações ativadas ✅',
      corpo: 'Você será avisado 5 segundos antes e no fim de cada descanso.',
    })
    return res.status(200).json({ enviados })
  }

  if (acao === 'descanso') {
    const fimEm = Number(req.body?.fimEm)
    const corpo = typeof req.body?.corpo === 'string' ? req.body.corpo.slice(0, 120) : ''
    if (!Number.isFinite(fimEm) || fimEm < Date.now() - 1000 || fimEm > Date.now() + 31 * 60 * 1000) {
      return res.status(400).json({ error: 'Horário de término inválido.' })
    }
    const token = await registrarDescanso(userId, fimEm)
    waitUntil(executarAgendamento({ userId, token, fimEm, corpo, continuar: criarContinuacao(req) }))
    return res.status(202).json({ ok: true })
  }

  if (acao === 'cancelar') {
    await cancelarDescanso(userId)
    return res.status(200).json({ ok: true })
  }

  return res.status(404).json({ error: 'Ação desconhecida.' })
}

export default async function handler(req, res) {
  try {
    if (req.query?.push) return await tratarPush(req, res)

    const userId = requireAuth(req)

    if (req.method === 'GET') {
      // select * mantém a leitura funcionando mesmo antes de a coluna descanso_min existir
      const usuarios = await sql`select * from users where id = ${userId}`
      if (usuarios.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' })
      const { senha_hash, created_at, ...perfil } = usuarios[0]
      return res.status(200).json({ descanso_min: null, fullbody_ativo: false, ...perfil })
    }

    if (req.method === 'PUT') {
      const { idade, altura, peso, descanso_min, fullbody_ativo } = req.body || {}
      const fullbody = fullbody_ativo === true
      const descanso = descanso_min != null && descanso_min !== '' ? Number(descanso_min) : null
      if (descanso != null && (!Number.isFinite(descanso) || descanso < 0.25 || descanso > 30)) {
        return res.status(400).json({ error: 'Tempo de descanso deve ser entre 0,25 e 30 minutos.' })
      }
      const atualizar = () => sql`
        update users set
          idade = ${idade || null},
          altura_cm = ${altura || null},
          peso_kg = ${peso || null},
          descanso_min = ${descanso},
          fullbody_ativo = ${fullbody}
        where id = ${userId}
        returning id, nome, email, idade, altura_cm, peso_kg, role, descanso_min, fullbody_ativo`
      let atualizados
      try {
        atualizados = await atualizar()
      } catch (err) {
        // Coluna nova ainda não criada: cria na hora (evita depender do /api/setup)
        if (err.code !== '42703') throw err
        await sql`alter table users add column if not exists fullbody_ativo boolean not null default false`
        atualizados = await atualizar()
      }
      return res.status(200).json(atualizados[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
