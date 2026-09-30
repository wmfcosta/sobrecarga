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

// Colunas do "plano como treino do dia": modelo do plano, estrutura das séries
// prescritas, dia do plano usado no treino e tipo de cada série registrada.
let colunasPlanoProntas = null
export function garantirColunasPlano() {
  colunasPlanoProntas ??= (async () => {
    await sql`alter table plans add column if not exists modelo text`
    await sql`alter table plan_exercises add column if not exists series_detalhe jsonb`
    await sql`alter table workouts add column if not exists plan_day_id uuid`
    await sql`alter table workout_sets add column if not exists tipo_serie text`
  })().catch((e) => { colunasPlanoProntas = null; throw e })
  return colunasPlanoProntas
}

export const TIPOS_SERIE = ['aquecimento', 'feeder', 'working', 'backoff']
