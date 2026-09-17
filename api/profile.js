import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)

    if (req.method === 'GET') {
      const usuarios = await sql`select id, nome, email, idade, altura_cm, peso_kg from users where id = ${userId}`
      if (usuarios.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' })
      return res.status(200).json(usuarios[0])
    }

    if (req.method === 'PUT') {
      const { idade, altura, peso } = req.body || {}
      const atualizados = await sql`
        update users set
          idade = ${idade || null},
          altura_cm = ${altura || null},
          peso_kg = ${peso || null}
        where id = ${userId}
        returning id, nome, email, idade, altura_cm, peso_kg`
      return res.status(200).json(atualizados[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
