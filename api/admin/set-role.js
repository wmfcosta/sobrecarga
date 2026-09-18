import { sql } from '../_lib/db.js'

// Promove/rebaixa um usuário entre 'aluno' e 'personal'. Protegido pela mesma
// chave do setup.js — não há UI para isso ainda, é uma chamada manual (Postman,
// curl) até existir uma tela de administração.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const chave = req.headers['x-setup-key']
  if (chave !== 'ferro-setup-2026') return res.status(401).json({ error: 'Não autorizado' })

  const { email, role } = req.body || {}
  if (!email || !['aluno', 'personal'].includes(role)) {
    return res.status(400).json({ error: "Informe email e role ('aluno' ou 'personal')." })
  }

  const atualizados = await sql`
    update users set role = ${role}
    where email = ${email.trim().toLowerCase()}
    returning id, nome, email, role`
  if (atualizados.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' })

  return res.status(200).json(atualizados[0])
}
