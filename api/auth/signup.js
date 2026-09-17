import { sql } from '../_lib/db.js'
import { hashSenha, gerarToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { nome, email, senha, idade, altura, peso } = req.body || {}
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Preencha nome, e-mail e senha.' })
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const existente = await sql`select id from users where email = ${emailNormalizado}`
    if (existente.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' })
    }

    const hash = await hashSenha(senha)
    const criados = await sql`
      insert into users (nome, email, senha_hash, idade, altura_cm, peso_kg)
      values (${nome.trim()}, ${emailNormalizado}, ${hash}, ${idade || null}, ${altura || null}, ${peso || null})
      returning id, nome, email, idade, altura_cm, peso_kg`
    const user = criados[0]
    const token = gerarToken(user.id)
    return res.status(200).json({ token, user })
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao cadastrar. Tente novamente.' })
  }
}
