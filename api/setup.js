import { sql } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const chave = req.headers['x-setup-key']
  if (chave !== 'ferro-setup-2026') return res.status(401).json({ error: 'Não autorizado' })

  await sql`create extension if not exists pgcrypto`

  await sql`create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text unique not null,
    senha_hash text not null,
    created_at timestamptz not null default now()
  )`

  await sql`alter table users add column if not exists idade int`
  await sql`alter table users add column if not exists altura_cm numeric(5,1)`
  await sql`alter table users add column if not exists peso_kg numeric(5,1)`
  await sql`alter table users add column if not exists role text not null default 'aluno'`
  // Tempo de descanso entre séries, em minutos (aceita fração: 1.5 = 1min30s)
  await sql`alter table users add column if not exists descanso_min numeric(5,2)`
  // Mostra (ou não) o cartão de sugestão full body na tela de Treino
  await sql`alter table users add column if not exists fullbody_ativo boolean not null default false`

  await sql`create table if not exists exercises (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    grupo_muscular text,
    created_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now()
  )`

  await sql`create table if not exists workouts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    data date not null default current_date,
    created_at timestamptz not null default now(),
    unique(user_id, data)
  )`

  await sql`create table if not exists workout_sets (
    id uuid primary key default gen_random_uuid(),
    workout_id uuid not null references workouts(id) on delete cascade,
    exercise_id uuid not null references exercises(id) on delete restrict,
    numero_serie int not null default 1,
    carga_kg numeric(6,2),
    repeticoes int,
    tempo_min numeric(6,1),
    calorias int,
    created_at timestamptz not null default now()
  )`

  await sql`create table if not exists assessments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    data date not null,
    peso_kg numeric(5,1),
    percentual_gordura numeric(4,1),
    massa_magra_kg numeric(5,1),
    agua_kg numeric(5,1),
    tmb int,
    rcq numeric(4,2),
    coxa_mm numeric(4,1),
    escapula_mm numeric(4,1),
    peito_mm numeric(4,1),
    abdominal_mm numeric(4,1),
    axila_mm numeric(4,1),
    triceps_mm numeric(4,1),
    suprailiaca_mm numeric(4,1),
    created_at timestamptz not null default now(),
    unique(user_id, data)
  )`

  // Plano de treino periodizado: o personal (role = 'personal') prescreve um ciclo
  // semanal fixo (Treino A, B, C...) para um aluno. É referência — o registro real
  // de carga/séries continua livre, nas tabelas workouts/workout_sets acima.
  await sql`create table if not exists plans (
    id uuid primary key default gen_random_uuid(),
    aluno_id uuid not null references users(id) on delete cascade,
    personal_id uuid references users(id) on delete set null,
    nome text not null,
    ativo boolean not null default true,
    created_at timestamptz not null default now()
  )`

  await sql`create unique index if not exists plans_aluno_ativo_idx
    on plans (aluno_id) where ativo`

  await sql`create table if not exists plan_days (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references plans(id) on delete cascade,
    rotulo text not null,
    ordem int not null default 0
  )`

  await sql`create table if not exists plan_exercises (
    id uuid primary key default gen_random_uuid(),
    plan_day_id uuid not null references plan_days(id) on delete cascade,
    exercicio_nome text not null,
    series_alvo int,
    repeticoes_alvo text,
    carga_alvo_kg numeric(6,2),
    observacoes text,
    ordem int not null default 0
  )`

  const existentes = await sql`select count(*)::int as total from exercises`
  if (existentes[0].total === 0) {
    await sql`insert into exercises (nome, grupo_muscular) values
      ('Supino reto', 'Peito'),
      ('Supino inclinado', 'Peito'),
      ('Crucifixo', 'Peito'),
      ('Agachamento livre', 'Pernas'),
      ('Leg press', 'Pernas'),
      ('Cadeira extensora', 'Pernas'),
      ('Cadeira flexora', 'Pernas'),
      ('Levantamento terra', 'Posterior/Costas'),
      ('Puxada frente', 'Costas'),
      ('Remada curvada', 'Costas'),
      ('Remada baixa', 'Costas'),
      ('Desenvolvimento militar', 'Ombro'),
      ('Elevação lateral', 'Ombro'),
      ('Rosca direta', 'Bíceps'),
      ('Rosca alternada', 'Bíceps'),
      ('Tríceps corda', 'Tríceps'),
      ('Tríceps testa', 'Tríceps'),
      ('Abdominal supra', 'Abdômen'),
      ('Panturrilha em pé', 'Panturrilha'),
      ('Esteira', 'Cardio'),
      ('Bicicleta ergométrica', 'Cardio'),
      ('Elíptico', 'Cardio'),
      ('Corrida', 'Cardio'),
      ('Pular corda', 'Cardio')`
  }

  return res.status(200).json({ ok: true })
}
