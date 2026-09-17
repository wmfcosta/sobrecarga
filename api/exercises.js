import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const exercicios = await sql`select id, nome, grupo_muscular from exercises order by grupo_muscular, nome`
      return res.status(200).json(exercicios)
    }
    if (req.method === 'POST') {
      const userId = requireAuth(req)
      const { nome, grupo_muscular } = req.body || {}
      if (!nome) return res.status(400).json({ error: 'Informe o nome do exercício.' })
      const criados = await sql`
        insert into exercises (nome, grupo_muscular, created_by)
        values (${nome.trim()}, ${grupo_muscular || null}, ${userId})
        returning id, nome, grupo_muscular`
      return res.status(200).json(criados[0])
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
