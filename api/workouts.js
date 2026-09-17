import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)

    if (req.method === 'GET') {
      const { data } = req.query
      if (!data) return res.status(400).json({ error: 'Informe a data.' })
      const treinos = await sql`select id, data::text as data from workouts where user_id = ${userId} and data = ${data} limit 1`
      if (treinos.length === 0) return res.status(200).json({ treino: null, series: [] })
      const treino = treinos[0]
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
      const criados = await sql`
        insert into workouts (user_id, data) values (${userId}, ${data})
        on conflict (user_id, data) do update set data = excluded.data
        returning id, data::text as data`
      return res.status(200).json(criados[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
