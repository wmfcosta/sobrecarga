import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'
import { garantirColunasSessao, garantirColunasPlano } from './_lib/sessao.js'

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    await garantirColunasSessao()
    await garantirColunasPlano()

    // ?exercicio=ID&antes=AAAA-MM-DD: só a última sessão desse exercício antes da data
    const { exercicio, antes } = req.query
    if (exercicio) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(antes || '')) return res.status(400).json({ error: 'Data inválida' })
      const series = await sql`
        with ultima as (
          select w.id, w.data from workouts w
          join workout_sets ws on ws.workout_id = w.id
          where w.user_id = ${userId} and ws.exercise_id = ${exercicio} and w.data < ${antes}
          order by w.data desc limit 1
        )
        select ws.id, ws.numero_serie, ws.carga_kg, ws.repeticoes, ws.tempo_min, ws.calorias, ws.tipo_serie,
               u.data::text as data
        from ultima u
        join workout_sets ws on ws.workout_id = u.id and ws.exercise_id = ${exercicio}
        order by ws.numero_serie, ws.created_at`
      if (!series.length) return res.status(200).json(null)
      return res.status(200).json({ data: series[0].data, series })
    }
    const treinos = await sql`
      select id, data::text as data, duracao_min, calorias_total, intensidade
      from workouts where user_id = ${userId} order by data desc`
    const series = await sql`
      select ws.id, ws.workout_id, ws.exercise_id, ws.numero_serie, ws.carga_kg, ws.repeticoes, ws.tempo_min, ws.calorias,
             ws.tipo_serie, e.nome as exercicio_nome, e.grupo_muscular
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
