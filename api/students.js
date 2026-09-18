import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

// Lista de alunos, visível apenas para quem tem role = 'personal'.
export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const solicitantes = await sql`select role from users where id = ${userId}`
    if (solicitantes[0]?.role !== 'personal') {
      return res.status(403).json({ error: 'Apenas o personal pode ver a lista de alunos.' })
    }

    const alunos = await sql`
      select id, nome, email from users where role = 'aluno' order by nome`
    return res.status(200).json(alunos)
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
