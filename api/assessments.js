import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

const CAMPOS = [
  'peso_kg', 'percentual_gordura', 'massa_magra_kg', 'agua_kg', 'tmb', 'rcq',
  'coxa_mm', 'escapula_mm', 'peito_mm', 'abdominal_mm', 'axila_mm', 'triceps_mm', 'suprailiaca_mm',
]

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)

    if (req.method === 'GET') {
      const linhas = await sql`
        select id, data::text as data, peso_kg, percentual_gordura, massa_magra_kg, agua_kg, tmb, rcq,
               coxa_mm, escapula_mm, peito_mm, abdominal_mm, axila_mm, triceps_mm, suprailiaca_mm
        from assessments
        where user_id = ${userId}
        order by data asc`
      return res.status(200).json(linhas)
    }

    if (req.method === 'POST') {
      const b = req.body || {}
      if (!b.data) return res.status(400).json({ error: 'Informe a data.' })
      const criados = await sql`
        insert into assessments (
          user_id, data, peso_kg, percentual_gordura, massa_magra_kg, agua_kg, tmb, rcq,
          coxa_mm, escapula_mm, peito_mm, abdominal_mm, axila_mm, triceps_mm, suprailiaca_mm
        ) values (
          ${userId}, ${b.data}, ${b.peso_kg ?? null}, ${b.percentual_gordura ?? null}, ${b.massa_magra_kg ?? null}, ${b.agua_kg ?? null}, ${b.tmb ?? null}, ${b.rcq ?? null},
          ${b.coxa_mm ?? null}, ${b.escapula_mm ?? null}, ${b.peito_mm ?? null}, ${b.abdominal_mm ?? null}, ${b.axila_mm ?? null}, ${b.triceps_mm ?? null}, ${b.suprailiaca_mm ?? null}
        )
        on conflict (user_id, data) do update set
          peso_kg = excluded.peso_kg,
          percentual_gordura = excluded.percentual_gordura,
          massa_magra_kg = excluded.massa_magra_kg,
          agua_kg = excluded.agua_kg,
          tmb = excluded.tmb,
          rcq = excluded.rcq,
          coxa_mm = excluded.coxa_mm,
          escapula_mm = excluded.escapula_mm,
          peito_mm = excluded.peito_mm,
          abdominal_mm = excluded.abdominal_mm,
          axila_mm = excluded.axila_mm,
          triceps_mm = excluded.triceps_mm,
          suprailiaca_mm = excluded.suprailiaca_mm
        returning id, data::text as data`
      return res.status(200).json(criados[0])
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Informe o id.' })
      await sql`delete from assessments where id = ${id} and user_id = ${userId}`
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
