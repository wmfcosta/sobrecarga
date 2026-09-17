import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function getSecret() {
  // Deriva a chave de assinatura da própria DATABASE_URL, que já é secreta e
  // única por deploy — evita depender de mais uma variável de ambiente.
  return crypto.createHash('sha256').update(process.env.DATABASE_URL || 'ferro-fallback').digest()
}

export async function hashSenha(senha) {
  return bcrypt.hash(senha, 10)
}

export async function verificarSenha(senha, hash) {
  return bcrypt.compare(senha, hash)
}

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

export function gerarToken(userId) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({ sub: userId, iat: Date.now() }))
  const data = `${header}.${payload}`
  const assinatura = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
  return `${data}.${assinatura}`
}

export function verificarToken(token) {
  const partes = token.split('.')
  if (partes.length !== 3) return null
  const [header, payload, assinatura] = partes
  const data = `${header}.${payload}`
  const esperada = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
  if (assinatura !== esperada) return null
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return json.sub || null
  } catch {
    return null
  }
}

export function requireAuth(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const userId = token && verificarToken(token)
  if (!userId) {
    const erro = new Error('Não autorizado')
    erro.status = 401
    throw erro
  }
  return userId
}
