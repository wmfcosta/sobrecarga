import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'
import { MODELOS_PLANO, norm, resumoModelos, estruturaDoModelo, modeloDoPlano } from './_lib/modelosPlano.js'
import { garantirColunasPlano } from './_lib/sessao.js'

async function carregarPlanoCompleto(planoId) {
  await garantirColunasPlano()
  const planos = await sql`select id, aluno_id, personal_id, nome, ativo, modelo from plans where id = ${planoId}`
  const plano = planos[0]
  if (!plano) return null
  plano.modelo = modeloDoPlano(plano)

  const dias = await sql`
    select id, rotulo, ordem from plan_days where plan_id = ${plano.id} order by ordem`
  for (const [i, dia] of dias.entries()) {
    dia.exercicios = await sql`
      select id, exercicio_nome, series_alvo, repeticoes_alvo, carga_alvo_kg, observacoes, ordem, series_detalhe
      from plan_exercises where plan_day_id = ${dia.id} order by ordem`
    // Planos ativados antes de existir a estrutura: completa a partir do modelo
    if (plano.modelo) {
      dia.exercicios.forEach((ex, j) => {
        ex.series_detalhe ??= estruturaDoModelo(plano.modelo, i, j)
      })
    }
  }
  plano.dias = dias
  return plano
}

async function criarPlano(alunoId, personalId, nome, dias, modelo = null) {
  await garantirColunasPlano()
  await sql`update plans set ativo = false where aluno_id = ${alunoId} and ativo`

  const criados = await sql`
    insert into plans (aluno_id, personal_id, nome, ativo, modelo)
    values (${alunoId}, ${personalId}, ${nome}, true, ${modelo})
    returning id`
  const planId = criados[0].id

  for (let i = 0; i < dias.length; i++) {
    const dia = dias[i]
    const diasCriados = await sql`
      insert into plan_days (plan_id, rotulo, ordem)
      values (${planId}, ${dia.rotulo}, ${i})
      returning id`
    const diaId = diasCriados[0].id

    const exercicios = dia.exercicios || []
    for (let j = 0; j < exercicios.length; j++) {
      const ex = exercicios[j]
      if (!ex.exercicio_nome) continue
      await sql`
        insert into plan_exercises (
          plan_day_id, exercicio_nome, series_alvo, repeticoes_alvo, carga_alvo_kg, observacoes, ordem, series_detalhe
        ) values (
          ${diaId}, ${ex.exercicio_nome.trim()}, ${ex.series_alvo || null},
          ${ex.repeticoes_alvo || null}, ${ex.carga_alvo_kg || null}, ${ex.observacoes || null}, ${j},
          ${ex.series_detalhe ? JSON.stringify(ex.series_detalhe) : null}
        )`
    }
  }

  return planId
}

// Garante que cada exercício do modelo exista no cadastro. Reaproveita o exercício
// já cadastrado (pelo nome ou por um alias) para manter o histórico de carga.
async function resolverExerciciosDoModelo(modelo, userId) {
  const cadastro = await sql`select id, nome from exercises`
  const porNome = new Map(cadastro.map((ex) => [norm(ex.nome), ex.nome]))
  const resolvidos = new Map()
  let criados = 0

  for (const dia of modelo.dias) {
    for (const ex of dia.exercicios) {
      const chave = norm(ex.nome)
      if (resolvidos.has(chave)) continue
      const candidato = [ex.nome, ...(ex.aliases || [])].map(norm).find((n) => porNome.has(n))
      if (candidato) {
        resolvidos.set(chave, porNome.get(candidato))
        continue
      }
      await sql`insert into exercises (nome, grupo_muscular, created_by) values (${ex.nome}, ${ex.grupo}, ${userId})`
      porNome.set(chave, ex.nome)
      resolvidos.set(chave, ex.nome)
      criados++
    }
  }

  const dias = modelo.dias.map((dia) => ({
    rotulo: dia.rotulo,
    exercicios: dia.exercicios.map((ex) => ({
      exercicio_nome: resolvidos.get(norm(ex.nome)),
      series_alvo: ex.series,
      repeticoes_alvo: ex.reps,
      observacoes: ex.obs,
      series_detalhe: ex.estrutura || null,
    })),
  }))
  return { dias, criados }
}

export default async function handler(req, res) {
  try {
    const userId = requireAuth(req)

    if (req.method === 'GET' && req.query.modelos) {
      return res.status(200).json(resumoModelos())
    }

    if (req.method === 'GET') {
      const { aluno_id } = req.query
      let alunoAlvo = userId

      if (aluno_id) {
        const solicitantes = await sql`select role from users where id = ${userId}`
        if (solicitantes[0]?.role !== 'personal') {
          return res.status(403).json({ error: 'Apenas o personal pode ver o plano de outro aluno.' })
        }
        alunoAlvo = aluno_id
      }

      const planosAtivos = await sql`
        select p.id, p.nome, u.nome as personal_nome
        from plans p
        left join users u on u.id = p.personal_id
        where p.aluno_id = ${alunoAlvo} and p.ativo`
      if (planosAtivos.length === 0) return res.status(200).json(null)

      const plano = await carregarPlanoCompleto(planosAtivos[0].id)
      plano.personal_nome = planosAtivos[0].personal_nome

      // Próximo treino da sequência: o dia seguinte ao último usado como treino do dia
      const ids = plano.dias.map((d) => d.id)
      const usados = ids.length
        ? await sql`
            select plan_day_id, data::text as data from workouts
            where user_id = ${alunoAlvo} and plan_day_id = any(${ids})
            order by data desc limit 1`
        : []
      const ultimo = usados[0]
      const indiceUltimo = ultimo ? ids.indexOf(ultimo.plan_day_id) : -1
      plano.proximo_dia_id = ids.length ? ids[(indiceUltimo + 1) % ids.length] : null
      plano.ultimo_uso = ultimo ? { plan_day_id: ultimo.plan_day_id, data: ultimo.data } : null
      return res.status(200).json(plano)
    }

    // Ativa um modelo de plano. O aluno ativa para si mesmo; o personal pode
    // ativar para um aluno informando aluno_id.
    if (req.method === 'POST' && req.body?.modelo) {
      const modelo = MODELOS_PLANO[req.body.modelo]
      if (!modelo) return res.status(404).json({ error: 'Modelo de plano não encontrado.' })

      let alunoAlvo = userId
      let personalId = null
      if (req.body.aluno_id && req.body.aluno_id !== userId) {
        const solicitantes = await sql`select role from users where id = ${userId}`
        if (solicitantes[0]?.role !== 'personal') {
          return res.status(403).json({ error: 'Apenas o personal pode ativar plano para outro aluno.' })
        }
        alunoAlvo = req.body.aluno_id
        personalId = userId
      }

      const { dias, criados } = await resolverExerciciosDoModelo(modelo, userId)
      const planId = await criarPlano(alunoAlvo, personalId, modelo.nome, dias, modelo.id)
      const plano = await carregarPlanoCompleto(planId)
      plano.exercicios_criados = criados
      return res.status(200).json(plano)
    }

    if (req.method === 'POST') {
      const solicitantes = await sql`select role from users where id = ${userId}`
      if (solicitantes[0]?.role !== 'personal') {
        return res.status(403).json({ error: 'Apenas o personal pode prescrever treinos.' })
      }

      const { aluno_id, nome, dias } = req.body || {}
      if (!aluno_id || !nome || !Array.isArray(dias) || dias.length === 0) {
        return res.status(400).json({ error: 'Informe aluno, nome do plano e ao menos um dia.' })
      }

      const planId = await criarPlano(aluno_id, userId, nome.trim(), dias)
      const plano = await carregarPlanoCompleto(planId)
      return res.status(200).json(plano)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Informe o id do plano.' })
      await sql`update plans set ativo = false where id = ${id} and personal_id = ${userId}`
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Erro interno' })
  }
}
