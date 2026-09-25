import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'
import { garantirColunasSessao } from './_lib/sessao.js'

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    await garantirColunasSessao()
    const treinos = await sql`
      select id, data::text as data, duracao_min, calorias_total, intensidade
      from workouts where user_id = ${userId} order by data desc`
    const series = await sql`
      select ws.id, ws.workout_id, ws.exercise_id, ws.numero_serie, ws.carga_kg, ws.repeticoes, ws.tempo_min, ws.calorias,
             e.nome as exercicio_nome
      from workout_sets ws
      join exercises e on e.id = ws.exercise_id
      join workouts w on w.id = ws.workout_id
      where w.user_id = ${userId}
      order by ws.created_at`

    const porTreino = {}
    for (const s of series) {
      if (!porTreino[s.workout_id]) porTreino[s.workout_id] = []
      porTreino[s.workout_id].push(s)
    }
    const resultado = treinos.map((t) => ({ ...t, series: porTreino[t.id] || [] }))
    return res.status(200).json(resultado)
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
