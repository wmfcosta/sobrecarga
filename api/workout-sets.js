import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)

    if (req.method === 'POST') {
      const { workout_id, exercise_id, numero_serie, carga_kg, repeticoes, tempo_min, calorias } = req.body || {}
      if (!workout_id || !exercise_id) return res.status(400).json({ error: 'Dados incompletos.' })

      const dono = await sql`select id from workouts where id = ${workout_id} and user_id = ${userId}`
      if (dono.length === 0) return res.status(403).json({ error: 'Não autorizado.' })

      const criados = await sql`
        insert into workout_sets (workout_id, exercise_id, numero_serie, carga_kg, repeticoes, tempo_min, calorias)
        values (${workout_id}, ${exercise_id}, ${numero_serie || 1}, ${carga_kg ?? null}, ${repeticoes ?? null}, ${tempo_min ?? null}, ${calorias ?? null})
        returning id`
      return res.status(200).json(criados[0])
    }

    if (req.method === 'PUT') {
      const { id, numero_serie, carga_kg, repeticoes, tempo_min, calorias } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Informe o id.' })

      const dono = await sql`
        select ws.id from workout_sets ws
        join workouts w on w.id = ws.workout_id
        where ws.id = ${id} and w.user_id = ${userId}`
      if (dono.length === 0) return res.status(403).json({ error: 'Não autorizado.' })

      await sql`
        update workout_sets set
          numero_serie = ${numero_serie || 1},
          carga_kg = ${carga_kg ?? null},
          repeticoes = ${repeticoes ?? null},
          tempo_min = ${tempo_min ?? null},
          calorias = ${calorias ?? null}
        where id = ${id}`
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Informe o id.' })
      await sql`
        delete from workout_sets
        using workouts
        where workout_sets.id = ${id}
          and workout_sets.workout_id = workouts.id
          and workouts.user_id = ${userId}`
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
