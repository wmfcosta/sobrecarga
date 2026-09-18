import { sql } from '../_lib/db.js'

// Endpoint unico de administracao (protegido pela chave do setup.js), reunindo
// duas rotinas pontuais num so arquivo para nao estourar o limite de 12
// Serverless Functions do plano Hobby da Vercel:
//   POST /api/admin  { action: 'set-role', email, role }
//   POST /api/admin  { action: 'import-exercises' }

const EXERCICIOS = [
  { nome: 'Supino reto com barra', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/EIeI8Vf.gif', exdb: 'EIeI8Vf', antigo: 'Supino reto' },
  { nome: 'Supino inclinado com barra', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/3TZduzM.gif', exdb: '3TZduzM', antigo: 'Supino inclinado' },
  { nome: 'Supino declinado com barra', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/GrO65fd.gif', exdb: 'GrO65fd', antigo: null },
  { nome: 'Supino fechado com barra', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/J6Dx1Mu.gif', exdb: 'J6Dx1Mu', antigo: null },
  { nome: 'Crucifixo com halteres', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/Bpkf41o.gif', exdb: 'Bpkf41o', antigo: 'Crucifixo' },
  { nome: 'Crucifixo inclinado com halteres', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/ESOd5Pl.gif', exdb: 'ESOd5Pl', antigo: null },
  { nome: 'Crossover no cabo', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/j7XMAyn.gif', exdb: 'j7XMAyn', antigo: null },
  { nome: 'Flexão de braço', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/JmMVpR3.gif', exdb: 'JmMVpR3', antigo: null },
  { nome: 'Mergulho (dips) para peito', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/9WTm7dq.gif', exdb: '9WTm7dq', antigo: null },
  { nome: 'Supino no cabo', grupo: 'Peito', gif: 'https://static.exercisedb.dev/media/7xI5MXA.gif', exdb: '7xI5MXA', antigo: null },
  { nome: 'Puxada frente aberta', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/ecpY0rH.gif', exdb: 'ecpY0rH', antigo: 'Puxada frente' },
  { nome: 'Remada curvada com barra', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/eZyBC3j.gif', exdb: 'eZyBC3j', antigo: 'Remada curvada' },
  { nome: 'Remada unilateral com halter', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/g9AsZ8P.gif', exdb: 'g9AsZ8P', antigo: null },
  { nome: 'Remada cavalinho (T-bar)', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/FVM1AUZ.gif', exdb: 'FVM1AUZ', antigo: null },
  { nome: 'Barra fixa pegada neutra', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/0V2YQjW.gif', exdb: '0V2YQjW', antigo: null },
  { nome: 'Barra fixa supinada', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/dVeWXf2.gif', exdb: 'dVeWXf2', antigo: null },
  { nome: 'Levantamento terra', grupo: 'Posterior/Costas', gif: 'https://static.exercisedb.dev/media/ila4NZS.gif', exdb: 'ila4NZS', antigo: 'Levantamento terra' },
  { nome: 'Levantamento terra sumô', grupo: 'Posterior/Costas', gif: 'https://static.exercisedb.dev/media/KgI0tqW.gif', exdb: 'KgI0tqW', antigo: null },
  { nome: 'Levantamento terra romeno', grupo: 'Posterior/Costas', gif: 'https://static.exercisedb.dev/media/5eLRITT.gif', exdb: '5eLRITT', antigo: null },
  { nome: 'Encolhimento de ombros (shrug)', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/dG7tG5y.gif', exdb: 'dG7tG5y', antigo: null },
  { nome: 'Hiperextensão lombar', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/8urJS9b.gif', exdb: '8urJS9b', antigo: null },
  { nome: 'Bom dia (good morning)', grupo: 'Costas', gif: 'https://static.exercisedb.dev/media/JrOHAZc.gif', exdb: 'JrOHAZc', antigo: null },
  { nome: 'Agachamento livre com barra', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/DhMl549.gif', exdb: 'DhMl549', antigo: 'Agachamento livre' },
  { nome: 'Agachamento frontal', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/DB0n8AG.gif', exdb: 'DB0n8AG', antigo: null },
  { nome: 'Agachamento hack', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/5VCj6iH.gif', exdb: '5VCj6iH', antigo: null },
  { nome: 'Agachamento búlgaro', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/HBYyX94.gif', exdb: 'HBYyX94', antigo: null },
  { nome: 'Leg press 45°', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/2Qh2J1e.gif', exdb: '2Qh2J1e', antigo: 'Leg press' },
  { nome: 'Cadeira flexora', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/17lJ1kr.gif', exdb: '17lJ1kr', antigo: 'Cadeira flexora' },
  { nome: 'Afundo (avanço)', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/IZVHb27.gif', exdb: 'IZVHb27', antigo: null },
  { nome: 'Passada com halteres', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/gFyFj9z.gif', exdb: 'gFyFj9z', antigo: null },
  { nome: 'Cadeira abdutora', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/CHpahtl.gif', exdb: 'CHpahtl', antigo: null },
  { nome: 'Cadeira adutora', grupo: 'Pernas', gif: 'https://static.exercisedb.dev/media/hBGWILP.gif', exdb: 'hBGWILP', antigo: null },
  { nome: 'Panturrilha em pé', grupo: 'Panturrilha', gif: 'https://static.exercisedb.dev/media/8ozhUIZ.gif', exdb: '8ozhUIZ', antigo: 'Panturrilha em pé' },
  { nome: 'Panturrilha sentado', grupo: 'Panturrilha', gif: 'https://static.exercisedb.dev/media/ipvgBnC.gif', exdb: 'ipvgBnC', antigo: null },
  { nome: 'Panturrilha no leg press', grupo: 'Panturrilha', gif: 'https://static.exercisedb.dev/media/IeDEXTe.gif', exdb: 'IeDEXTe', antigo: null },
  { nome: 'Panturrilha unilateral (burrinho)', grupo: 'Panturrilha', gif: 'https://static.exercisedb.dev/media/A2upspL.gif', exdb: 'A2upspL', antigo: null },
  { nome: 'Elevação de quadril (glúteo ponte)', grupo: 'Glúteos', gif: 'https://static.exercisedb.dev/media/GibBPPg.gif', exdb: 'GibBPPg', antigo: null },
  { nome: 'Ponte de glúteo com apoio', grupo: 'Glúteos', gif: 'https://static.exercisedb.dev/media/aWedzZX.gif', exdb: 'aWedzZX', antigo: null },
  { nome: 'Agachamento sumô com halter', grupo: 'Glúteos', gif: 'https://static.exercisedb.dev/media/KgI0tqW.gif', exdb: 'KgI0tqW', antigo: null },
  { nome: 'Desenvolvimento militar com barra', grupo: 'Ombro', gif: 'https://static.exercisedb.dev/media/jjUPrze.gif', exdb: 'jjUPrze', antigo: 'Desenvolvimento militar' },
  { nome: 'Desenvolvimento com halteres', grupo: 'Ombro', gif: 'https://static.exercisedb.dev/media/A6wtbuL.gif', exdb: 'A6wtbuL', antigo: null },
  { nome: 'Desenvolvimento Arnold', grupo: 'Ombro', gif: 'https://static.exercisedb.dev/media/GTHkgSt.gif', exdb: 'GTHkgSt', antigo: null },
  { nome: 'Elevação lateral com halteres', grupo: 'Ombro', gif: 'https://static.exercisedb.dev/media/53Ttlck.gif', exdb: '53Ttlck', antigo: 'Elevação lateral' },
  { nome: 'Elevação frontal com barra', grupo: 'Ombro', gif: 'https://static.exercisedb.dev/media/oGDeFhu.gif', exdb: 'oGDeFhu', antigo: null },
  { nome: 'Crucifixo invertido (posterior de ombro)', grupo: 'Ombro', gif: 'https://static.exercisedb.dev/media/OTgt5tt.gif', exdb: 'OTgt5tt', antigo: null },
  { nome: 'Remada alta (upright row)', grupo: 'Ombro', gif: 'https://static.exercisedb.dev/media/ZWtLkKW.gif', exdb: 'ZWtLkKW', antigo: null },
  { nome: 'Rosca direta com barra', grupo: 'Bíceps', gif: 'https://static.exercisedb.dev/media/ILb1yaJ.gif', exdb: 'ILb1yaJ', antigo: 'Rosca direta' },
  { nome: 'Rosca alternada com halteres', grupo: 'Bíceps', gif: 'https://static.exercisedb.dev/media/2NpxjC1.gif', exdb: '2NpxjC1', antigo: 'Rosca alternada' },
  { nome: 'Rosca martelo', grupo: 'Bíceps', gif: 'https://static.exercisedb.dev/media/2NpxjC1.gif', exdb: '2NpxjC1', antigo: null },
  { nome: 'Rosca scott (preacher)', grupo: 'Bíceps', gif: 'https://static.exercisedb.dev/media/mrZ2Q9s.gif', exdb: 'mrZ2Q9s', antigo: null },
  { nome: 'Rosca concentrada', grupo: 'Bíceps', gif: 'https://static.exercisedb.dev/media/8xoJViv.gif', exdb: '8xoJViv', antigo: null },
  { nome: 'Rosca no cabo', grupo: 'Bíceps', gif: 'https://static.exercisedb.dev/media/kEbYOHV.gif', exdb: 'kEbYOHV', antigo: null },
  { nome: 'Tríceps testa (skull crusher)', grupo: 'Tríceps', gif: 'https://static.exercisedb.dev/media/1TVoin7.gif', exdb: '1TVoin7', antigo: 'Tríceps testa' },
  { nome: 'Tríceps corda no cabo', grupo: 'Tríceps', gif: 'https://static.exercisedb.dev/media/9nOAySG.gif', exdb: '9nOAySG', antigo: 'Tríceps corda' },
  { nome: 'Tríceps francês com halter', grupo: 'Tríceps', gif: 'https://static.exercisedb.dev/media/M8OGZTV.gif', exdb: 'M8OGZTV', antigo: null },
  { nome: 'Tríceps coice (kickback)', grupo: 'Tríceps', gif: 'https://static.exercisedb.dev/media/JbC53Rl.gif', exdb: 'JbC53Rl', antigo: null },
  { nome: 'Mergulho (dips) para tríceps', grupo: 'Tríceps', gif: 'https://static.exercisedb.dev/media/05Cf2v8.gif', exdb: '05Cf2v8', antigo: null },
  { nome: 'Rosca de punho (wrist curl)', grupo: 'Antebraço', gif: 'https://static.exercisedb.dev/media/1qOvXjv.gif', exdb: '1qOvXjv', antigo: null },
  { nome: 'Rosca de punho invertida', grupo: 'Antebraço', gif: 'https://static.exercisedb.dev/media/lNPQnJd.gif', exdb: 'lNPQnJd', antigo: null },
  { nome: 'Abdominal supra (crunch)', grupo: 'Abdômen', gif: 'https://static.exercisedb.dev/media/rQveJp8.gif', exdb: 'rQveJp8', antigo: 'Abdominal supra' },
  { nome: 'Abdominal na polia (cable crunch)', grupo: 'Abdômen', gif: 'https://static.exercisedb.dev/media/xtT4uV3.gif', exdb: 'xtT4uV3', antigo: null },
  { nome: 'Abdominal declinado', grupo: 'Abdômen', gif: 'https://static.exercisedb.dev/media/RaYNSEg.gif', exdb: 'RaYNSEg', antigo: null },
  { nome: 'Abdominal infra (elevação de pernas)', grupo: 'Abdômen', gif: 'https://static.exercisedb.dev/media/03lzqwk.gif', exdb: '03lzqwk', antigo: null },
  { nome: 'Prancha abdominal', grupo: 'Abdômen', gif: 'https://static.exercisedb.dev/media/5VXmnV5.gif', exdb: '5VXmnV5', antigo: null },
  { nome: 'Giro russo (russian twist)', grupo: 'Abdômen', gif: 'https://static.exercisedb.dev/media/Zx05HuA.gif', exdb: 'Zx05HuA', antigo: null },
  { nome: 'Escalador (mountain climber)', grupo: 'Abdômen', gif: 'https://static.exercisedb.dev/media/wPCXfMD.gif', exdb: 'wPCXfMD', antigo: null },
  { nome: 'Corrida na esteira', grupo: 'Cardio', gif: 'https://static.exercisedb.dev/media/T2XjO4o.gif', exdb: 'T2XjO4o', antigo: 'Corrida' },
  { nome: 'Bicicleta ergométrica', grupo: 'Cardio', gif: 'https://static.exercisedb.dev/media/vjjIji9.gif', exdb: 'vjjIji9', antigo: 'Bicicleta ergométrica' },
  { nome: 'Pular corda', grupo: 'Cardio', gif: 'https://static.exercisedb.dev/media/oCttmuP.gif', exdb: 'oCttmuP', antigo: 'Pular corda' },
  { nome: 'Burpee', grupo: 'Cardio', gif: 'https://static.exercisedb.dev/media/Gc0y7Ba.gif', exdb: 'Gc0y7Ba', antigo: null },
  { nome: 'Subida no step (stepmill)', grupo: 'Cardio', gif: 'https://static.exercisedb.dev/media/pKcCFwh.gif', exdb: 'pKcCFwh', antigo: null }
]

async function importarExercicios() {
  await sql`alter table exercises add column if not exists gif_url text`
  await sql`alter table exercises add column if not exists exercisedb_id text`

  let atualizados = 0
  let inseridos = 0

  for (const ex of EXERCICIOS) {
    if (ex.antigo) {
      const resultado = await sql`
        update exercises set nome = ${ex.nome}, gif_url = ${ex.gif}, exercisedb_id = ${ex.exdb}
        where lower(nome) = lower(${ex.antigo})
        returning id`
      if (resultado.length > 0) {
        atualizados++
        continue
      }
    }

    const existente = await sql`select id from exercises where lower(nome) = lower(${ex.nome})`
    if (existente.length > 0) {
      await sql`update exercises set gif_url = ${ex.gif}, exercisedb_id = ${ex.exdb}, grupo_muscular = ${ex.grupo} where id = ${existente[0].id}`
      atualizados++
    } else {
      await sql`insert into exercises (nome, grupo_muscular, gif_url, exercisedb_id) values (${ex.nome}, ${ex.grupo}, ${ex.gif}, ${ex.exdb})`
      inseridos++
    }
  }

  return { atualizados, inseridos, total: EXERCICIOS.length }
}

async function definirRole({ email, role }) {
  if (!email || !['aluno', 'personal'].includes(role)) {
    const erro = new Error("Informe email e role ('aluno' ou 'personal').")
    erro.status = 400
    throw erro
  }
  const atualizados = await sql`
    update users set role = ${role}
    where email = ${email.trim().toLowerCase()}
    returning id, nome, email, role`
  if (atualizados.length === 0) {
    const erro = new Error('Usuário não encontrado.')
    erro.status = 404
    throw erro
  }
  return atualizados[0]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const chave = req.headers['x-setup-key']
  if (chave !== 'ferro-setup-2026') return res.status(401).json({ error: 'Não autorizado' })

  const { action } = req.body || {}
  try {
    if (action === 'import-exercises') {
      const resultado = await importarExercicios()
      return res.status(200).json({ ok: true, ...resultado })
    }
    if (action === 'set-role') {
      const usuario = await definirRole(req.body || {})
      return res.status(200).json(usuario)
    }
    return res.status(400).json({ error: "Informe action: 'set-role' ou 'import-exercises'." })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
