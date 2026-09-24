import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  try {
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
