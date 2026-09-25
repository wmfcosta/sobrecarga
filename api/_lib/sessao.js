import { sql } from './db.js'

// Colunas da sessão de treino (início, fim, duração, calorias e intensidade).
// Criadas uma vez por instância, para não depender de rodar o /api/setup.
let colunasProntas = null
export function garantirColunasSessao() {
  colunasProntas ??= (async () => {
    await sql`alter table workouts add column if not exists inicio_em timestamptz`
    await sql`alter table workouts add column if not exists fim_em timestamptz`
    await sql`alter table workouts add column if not exists duracao_min int`
    await sql`alter table workouts add column if not exists calorias_total int`
    await sql`alter table workouts add column if not exists intensidade text`
  })().catch((e) => { colunasProntas = null; throw e })
  return colunasProntas
}
