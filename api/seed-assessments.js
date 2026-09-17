import { sql } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const chave = req.headers['x-setup-key']
  if (chave !== 'ferro-setup-2026') return res.status(401).json({ error: 'Não autorizado' })

  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Informe o email.' })

  const usuarios = await sql`select id from users where email = ${email.trim().toLowerCase()}`
  if (usuarios.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' })
  const userId = usuarios[0].id

  const linhas = [
    ['2025-06-10', 82.8, 19, 67.0, 48.9, null, null, 6.1, 5.9, 7, 16.2, 11.9, 3.8, 6.6],
    ['2025-08-20', 81.5, 17, 67.6, 49.4, null, null, 5.2, 5.3, 5.8, 13.3, 10.3, 3.7, 6.4],
    ['2025-10-22', 83.1, 16.1, 69.8, 50.9, null, null, 5.1, 5.1, 5.2, 12.7, 9.4, 3.2, 5.9],
    ['2025-12-23', 79.5, 14.9, 67.6, 49.4, null, null, 4.7, 4.7, 4.6, 11.9, 8.2, 3.1, 5.2],
    ['2026-02-20', 78.9, 14.3, 67.6, 49.4, null, null, 4.0, 4.4, 4.2, 11.5, 8.3, 2.8, 5.0],
    ['2026-04-24', 78.6, 13.1, 68.3, 49.9, null, 0.95, 3.8, 3.7, 3.6, 10.8, 7.4, 2.6, 4.3],
    ['2026-06-24', 77.1, 12.2, 67.7, 49.4, null, 0.96, 3.7, 3.4, 2.8, 10.6, 6.4, 2.4, 4.2],
    ['2026-09-02', 77.8, 13.6, 67.3, 49.1, 1823, 0.97, 4.1, 3.9, 3.2, 11.8, 7.2, 2.6, 5.0],
  ]

  for (const [data, peso, gordura, massaMagra, agua, tmb, rcq, coxa, escapula, peito, abdominal, axila, triceps, suprailiaca] of linhas) {
    await sql`
      insert into assessments (
        user_id, data, peso_kg, percentual_gordura, massa_magra_kg, agua_kg, tmb, rcq,
        coxa_mm, escapula_mm, peito_mm, abdominal_mm, axila_mm, triceps_mm, suprailiaca_mm
      ) values (
        ${userId}, ${data}, ${peso}, ${gordura}, ${massaMagra}, ${agua}, ${tmb}, ${rcq},
        ${coxa}, ${escapula}, ${peito}, ${abdominal}, ${axila}, ${triceps}, ${suprailiaca}
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
        suprailiaca_mm = excluded.suprailiaca_mm`
  }

  return res.status(200).json({ ok: true, inseridos: linhas.length })
}
