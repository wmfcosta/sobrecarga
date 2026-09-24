import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

const INTENSIDADES = ['normal', 'moderado', 'pesado', 'desafiador']

// Colunas da sessão de treino (início, fim, duração, calorias e intensidade).
// Criadas uma vez por instância, para não depender de rodar o /api/setup.
let colunasProntas = null
function garantirColunas() {
  colunasProntas ??= (async () => {
    await sql`alter table workouts add column if not exists inicio_em timestamptz`
    await sql`alter table workouts add column if not exists fim_em timestamptz`
    await sql`alter table workouts add column if not exists duracao_min int`
    await sql`alter table workouts add column if not exists calorias_total int`
    await sql`alter table workouts add column if not exists intensidade text`
  })().catch((e) => { colunasProntas = null; throw e })
  return colunasProntas
}

async function buscarTreino(userId, filtro) {
  const linhas = filtro.id
    ? await sql`select id, data::text as data, inicio_em, fim_em, duracao_min, calorias_total, intensidade
                from workouts where id = ${filtro.id} and user_id = ${userId}`
    : await sql`select id, data::text as data, inicio_em, fim_em, duracao_min, calorias_total, intensidade
                from workouts where user_id = ${userId} and data = ${filtro.data} limit 1`
  return linhas[0] ?? null
}

function validarFinalizacao({ calorias, intensidade, duracao_min }) {
  const kcal = Number(calorias)
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > 5000) return 'Informe as calorias gastas (0 a 5000).'
  if (!INTENSIDADES.includes(intensidade)) return 'Escolha a intensidade do treino.'
  if (duracao_min != null && duracao_min !== '') {
    const d = Number(duracao_min)
    if (!Number.isFinite(d) || d < 1 || d > 600) return 'Duração deve ser entre 1 e 600 minutos.'
  }
  return null
}

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)
    await garantirColunas()

    if (req.method === 'GET') {
      const { data } = req.query
      if (!data) return res.status(400).json({ error: 'Informe a data.' })
      const treino = await buscarTreino(userId, { data })
      if (!treino) return res.status(200).json({ treino: null, series: [] })
      const series = await sql`
        select ws.id, ws.numero_serie, ws.carga_kg, ws.repeticoes, ws.tempo_min, ws.calorias, ws.exercise_id,
               e.nome as exercicio_nome, e.grupo_muscular
        from workout_sets ws
        join exercises e on e.id = ws.exercise_id
        where ws.workout_id = ${treino.id}
        order by ws.created_at`
      return res.status(200).json({ treino, series })
    }

    if (req.method === 'POST') {
      const { data } = req.body || {}
      if (!data) return res.status(400).json({ error: 'Informe a data.' })
      await sql`
        insert into workouts (user_id, data) values (${userId}, ${data})
        on conflict (user_id, data) do nothing`
      return res.status(200).json(await buscarTreino(userId, { data }))
    }

    // Sessão: iniciar, finalizar ou corrigir os dados de um treino finalizado
    if (req.method === 'PATCH') {
      const { acao, data, workout_id } = req.body || {}

      if (acao === 'iniciar') {
        if (!data) return res.status(400).json({ error: 'Informe a data.' })
        await sql`
          insert into workouts (user_id, data, inicio_em) values (${userId}, ${data}, now())
          on conflict (user_id, data) do update
            set inicio_em = coalesce(workouts.inicio_em, now())`
        return res.status(200).json(await buscarTreino(userId, { data }))
      }

      if (acao === 'finalizar' || acao === 'editar') {
        const treino = await buscarTreino(userId, { id: workout_id })
        if (!treino) return res.status(404).json({ error: 'Treino não encontrado.' })
        const erro = validarFinalizacao(req.body)
        if (erro) return res.status(400).json({ error: erro })
        const { calorias, intensidade, duracao_min } = req.body
        const duracaoInformada = duracao_min != null && duracao_min !== '' ? Math.round(Number(duracao_min)) : null

        if (acao === 'finalizar') {
          if (!treino.inicio_em) return res.status(400).json({ error: 'Este treino não foi iniciado.' })
          await sql`
            update workouts set
              fim_em = now(),
              duracao_min = coalesce(${duracaoInformada}::int,
                greatest(1, round(extract(epoch from (now() - inicio_em)) / 60))::int),
              calorias_total = ${Math.round(Number(calorias))},
              intensidade = ${intensidade}
            where id = ${treino.id}`
        } else {
          await sql`
            update workouts set
              duracao_min = coalesce(${duracaoInformada}::int, duracao_min),
              calorias_total = ${Math.round(Number(calorias))},
              intensidade = ${intensidade}
            where id = ${treino.id}`
        }
        return res.status(200).json(await buscarTreino(userId, { id: treino.id }))
      }

      if (acao === 'retomar') {
        const treino = await buscarTreino(userId, { id: workout_id })
        if (!treino) return res.status(404).json({ error: 'Treino não encontrado.' })
        await sql`update workouts set fim_em = null where id = ${treino.id}`
        return res.status(200).json(await buscarTreino(userId, { id: treino.id }))
      }

      return res.status(400).json({ error: 'Ação inválida.' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
