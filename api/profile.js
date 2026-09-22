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
      return res.status(200).json({ descanso_min: null, ...perfil })
    }

    if (req.method === 'PUT') {
      const { idade, altura, peso, descanso_min } = req.body || {}
      const descanso = descanso_min != null && descanso_min !== '' ? Number(descanso_min) : null
      if (descanso != null && (!Number.isFinite(descanso) || descanso < 0.25 || descanso > 30)) {
        return res.status(400).json({ error: 'Tempo de descanso deve ser entre 0,25 e 30 minutos.' })
      }
      const atualizados = await sql`
        update users set
          idade = ${idade || null},
          altura_cm = ${altura || null},
          peso_kg = ${peso || null},
          descanso_min = ${descanso}
        where id = ${userId}
        returning id, nome, email, idade, altura_cm, peso_kg, role, descanso_min`
      return res.status(200).json(atualizados[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
