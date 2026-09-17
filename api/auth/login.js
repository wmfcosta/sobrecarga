import { sql } from '../_lib/db.js'
import { verificarSenha, gerarToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { email, senha } = req.body || {}
    if (!email || !senha) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const usuarios = await sql`select id, nome, email, senha_hash, idade, altura_cm, peso_kg from users where email = ${emailNormalizado}`
    const user = usuarios[0]
    if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos.' })

    const ok = await verificarSenha(senha, user.senha_hash)
    if (!ok) return res.status(401).json({ error: 'E-mail ou senha incorretos.' })

    const token = gerarToken(user.id)
    return res.status(200).json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email, idade: user.idade, altura_cm: user.altura_cm, peso_kg: user.peso_kg },
    })
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao entrar. Tente novamente.' })
  }
}
