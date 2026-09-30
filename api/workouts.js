import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'
import { garantirColunasSessao, garantirColunasPlano } from './_lib/sessao.js'
import { estruturaDoModelo, modeloDoPlano, norm } from './_lib/modelosPlano.js'

const INTENSIDADES = ['normal', 'moderado', 'pesado', 'desafiador']

async function buscarTreino(userId, filtro) {
  const linhas = filtro.id
    ? await sql`select id, data::text as data, inicio_em, fim_em, duracao_min, calorias_total, intensidade, plan_day_id
                from workouts where id = ${filtro.id} and user_id = ${userId}`
    : await sql`select id, data::text as data, inicio_em, fim_em, duracao_min, calorias_total, intensidade, plan_day_id
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

// Dia do plano ligado ao treino: exercícios (com id do cadastro), séries prescritas
// e a última carga registrada de cada exercício (antes desta data) como referência.
async function carregarPlanoDoDia(userId, planDayId, data) {
  const dias = await sql`
    select d.id, d.rotulo, d.ordem, p.id as plan_id, p.nome as plano_nome, p.modelo
    from plan_days d join plans p on p.id = d.plan_id
    where d.id = ${planDayId} and p.aluno_id = ${userId}`
  const dia = dias[0]
  if (!dia) return null
  const modelo = modeloDoPlano({ modelo: dia.modelo, nome: dia.plano_nome })
  const indiceDia = (await sql`select id from plan_days where plan_id = ${dia.plan_id} order by ordem`)
    .findIndex((d) => d.id === dia.id)

  const prescritos = await sql`
    select id, exercicio_nome, series_alvo, repeticoes_alvo, observacoes, ordem, series_detalhe
    from plan_exercises where plan_day_id = ${dia.id} order by ordem`
  const cadastro = await sql`select id, nome, grupo_muscular, gif_url from exercises`
  const porNome = new Map(cadastro.map((e) => [norm(e.nome), e]))

  const exercicios = prescritos.map((ex, j) => {
    const cad = porNome.get(norm(ex.exercicio_nome))
    let series = ex.series_detalhe ?? (modelo ? estruturaDoModelo(modelo, indiceDia, j) : null)
    if (!series) {
      const n = Math.min(Math.max(Number(ex.series_alvo) || 3, 1), 10)
      series = Array.from({ length: n }, () => ({ tipo: null, reps: ex.repeticoes_alvo || null }))
    }
    return {
      id: ex.id,
      exercicio_nome: cad?.nome ?? ex.exercicio_nome,
      exercise_id: cad?.id ?? null,
      grupo_muscular: cad?.grupo_muscular ?? null,
      gif_url: cad?.gif_url ?? null,
      observacoes: ex.observacoes,
      series,
    }
  })

  // Última sessão de cada exercício antes desta data
  const idsCadastro = exercicios.map((e) => e.exercise_id).filter(Boolean)
  const anteriores = idsCadastro.length
    ? await sql`
        select ws.exercise_id, ws.numero_serie, ws.carga_kg, ws.repeticoes, w.data::text as data
        from workout_sets ws join workouts w on w.id = ws.workout_id
        where w.user_id = ${userId} and w.data < ${data} and ws.exercise_id = any(${idsCadastro})
        order by w.data desc, ws.numero_serie`
    : []
  const ultimaData = {}
  for (const s of anteriores) ultimaData[s.exercise_id] ??= s.data
  for (const ex of exercicios) {
    ex.anterior = anteriores
      .filter((s) => s.exercise_id === ex.exercise_id && s.data === ultimaData[ex.exercise_id])
      .map((s) => ({ numero_serie: s.numero_serie, carga_kg: s.carga_kg, repeticoes: s.repeticoes }))
  }

  return { id: dia.id, rotulo: dia.rotulo, plano_nome: dia.plano_nome, modelo, avancado: modelo === 'avancado', exercicios }
}

// Garante que os exercícios do dia existam no cadastro (planos montados à mão)
async function garantirExerciciosDoDia(userId, planDayId) {
  const prescritos = await sql`select exercicio_nome from plan_exercises where plan_day_id = ${planDayId}`
  const cadastro = await sql`select nome from exercises`
  const existentes = new Set(cadastro.map((e) => norm(e.nome)))
  for (const ex of prescritos) {
    if (existentes.has(norm(ex.exercicio_nome))) continue
    await sql`insert into exercises (nome, created_by) values (${ex.exercicio_nome.trim()}, ${userId})`
    existentes.add(norm(ex.exercicio_nome))
  }
}

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)
    await garantirColunasSessao()
    await garantirColunasPlano()

    if (req.method === 'GET') {
      const { data } = req.query
      if (!data) return res.status(400).json({ error: 'Informe a data.' })
      const treino = await buscarTreino(userId, { data })
      if (!treino) return res.status(200).json({ treino: null, series: [] })
      const series = await sql`
        select ws.id, ws.numero_serie, ws.carga_kg, ws.repeticoes, ws.tempo_min, ws.calorias, ws.exercise_id,
               ws.tipo_serie, e.nome as exercicio_nome, e.grupo_muscular
        from workout_sets ws
        join exercises e on e.id = ws.exercise_id
        where ws.workout_id = ${treino.id}
        order by ws.created_at`
      const plano_dia = treino.plan_day_id ? await carregarPlanoDoDia(userId, treino.plan_day_id, data) : null
      return res.status(200).json({ treino, series, plano_dia })
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

      // Usa um dia do plano ativo como o treino desta data
      if (acao === 'usar-plano') {
        const { plan_day_id } = req.body
        if (!data || !plan_day_id) return res.status(400).json({ error: 'Informe a data e o treino do plano.' })
        const permitido = await sql`
          select d.id from plan_days d join plans p on p.id = d.plan_id
          where d.id = ${plan_day_id} and p.aluno_id = ${userId} and p.ativo`
        if (permitido.length === 0) return res.status(404).json({ error: 'Treino do plano não encontrado.' })
        await garantirExerciciosDoDia(userId, plan_day_id)
        await sql`
          insert into workouts (user_id, data, plan_day_id) values (${userId}, ${data}, ${plan_day_id})
          on conflict (user_id, data) do update set plan_day_id = ${plan_day_id}`
        return res.status(200).json(await buscarTreino(userId, { data }))
      }

      if (acao === 'remover-plano') {
        if (!data) return res.status(400).json({ error: 'Informe a data.' })
        await sql`update workouts set plan_day_id = null where user_id = ${userId} and data = ${data}`
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
