// Motor de sugestão de treino full body.
//
// Regras baseadas em evidência (ver doc "pesquisa-full-body" no projeto):
// - Sessão de 9 exercícios por padrão de movimento: agachar, quadril, 2x empurrar,
//   2x puxar, 2º de perna (o mais atrasado na semana), core e acessório.
// - Compostos: 3 séries de 8-12 reps. Core e acessório: 2 séries de 10-15.
// - Rotação: evita repetir o exercício feito no treino anterior do mesmo padrão.
// - Carga por dupla progressão a partir da última sessão do exercício.

export const PADROES = {
  agachar: { rotulo: 'Agachar', faixa: [8, 12], metaSemana: 12, series: 3 },
  quadril: { rotulo: 'Quadril', faixa: [8, 12], metaSemana: 12, series: 3 },
  empurrar: { rotulo: 'Empurrar', faixa: [8, 12], metaSemana: 18, series: 3 },
  puxar: { rotulo: 'Puxar', faixa: [8, 12], metaSemana: 18, series: 3 },
  core: { rotulo: 'Core', faixa: [10, 15], metaSemana: 6, series: 2 },
  acessorio: { rotulo: 'Acessório', faixa: [10, 15], metaSemana: 6, series: 2 },
}


function norm(txt) {
  return (txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Classifica um exercício em padrão de movimento pelo nome e grupo muscular.
export function classificarPadrao(ex) {
  const nome = norm(ex.nome)
  const grupo = norm(ex.grupo_muscular)
  if (grupo === 'cardio') return null
  if (grupo === 'abdomen' || /abdominal|prancha|giro russo|escalador/.test(nome)) return 'core'
  if (/panturrilha|abdutora|adutora|rosca|triceps|encolhimento|shrug|elevacao lateral|elevacao frontal|crucifixo invertido|remada alta|punho/.test(nome)) return 'acessorio'
  if (/terra|stiff|flexora|bom dia|good morning|hiperextensao|elevacao de quadril|ponte|gluteo/.test(nome)) return 'quadril'
  if (/agachamento|leg press|afundo|passada|hack|extensora|bulgaro|avanco/.test(nome)) return 'agachar'
  if (/supino|desenvolvimento|flexao de braco|mergulho|crossover|crucifixo|push/.test(nome)) return 'empurrar'
  if (/puxada|remada|barra fixa|pull/.test(nome)) return 'puxar'
  if (grupo === 'peito') return 'empurrar'
  if (grupo === 'costas') return 'puxar'
  if (grupo === 'pernas') return 'agachar'
  if (grupo.startsWith('posterior') || grupo === 'gluteos') return 'quadril'
  if (grupo === 'ombro') return 'acessorio'
  return 'acessorio'
}

// Plano do movimento, usado para variar o 2º exercício de empurrar/puxar
function plano(ex) {
  const nome = norm(ex.nome)
  if (/desenvolvimento|puxada|barra fixa/.test(nome)) return 'vertical'
  return 'horizontal'
}

// Exercícios "base" preferidos para quem ainda não tem histórico
const PREFERIDOS = {
  agachar: ['agachamento livre', 'leg press', 'agachamento hack', 'agachamento bulgaro'],
  quadril: ['levantamento terra romeno', 'cadeira flexora', 'levantamento terra', 'elevacao de quadril'],
  empurrar: ['supino reto', 'desenvolvimento com halteres', 'supino inclinado', 'desenvolvimento militar'],
  puxar: ['puxada frente', 'remada baixa', 'remada curvada', 'remada unilateral'],
  core: ['abdominal na polia', 'abdominal supra', 'abdominal infra', 'abdominal declinado'],
  acessorio: ['rosca direta', 'triceps corda', 'elevacao lateral', 'panturrilha em pe'],
}

function prioridadePreferida(ex, padrao) {
  const nome = norm(ex.nome)
  const idx = (PREFERIDOS[padrao] || []).findIndex((p) => nome.includes(p))
  return idx === -1 ? 99 : idx
}

function arredondar(valor, passo = 0.5) {
  return Math.round(valor / passo) * passo
}

function inicioDaSemanaISO(iso) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

// Dupla progressão: olha a última sessão do exercício e sugere carga e reps.
export function sugerirCarga(seriesUltimaSessao, padrao) {
  const [min, max] = PADROES[padrao]?.faixa ?? [8, 12]
  const comCarga = (seriesUltimaSessao || []).filter((s) => s.carga_kg != null && s.repeticoes != null)
  if (comCarga.length === 0) {
    return {
      carga: null,
      reps: min + 2,
      motivo: `Primeira vez: use uma carga que permita ${min + 2} repetições deixando umas 2 de sobra.`,
    }
  }
  const cargaTopo = Math.max(...comCarga.map((s) => Number(s.carga_kg)))
  const naCarga = comCarga.filter((s) => Number(s.carga_kg) === cargaTopo)
  const reps = naCarga.map((s) => Number(s.repeticoes))
  const resumo = `${reps.join(', ')} reps com ${formatarKg(cargaTopo)}`
  const pesoCorporal = cargaTopo === 0

  if (reps.length >= 2 && reps.every((r) => r >= max)) {
    if (pesoCorporal) {
      return { carga: 0, reps: max + 1, motivo: `Da última vez: ${resumo}. Bateu o topo da faixa: suba as repetições ou adicione carga.` }
    }
    const pesado = padrao === 'agachar' || padrao === 'quadril'
    const incremento = pesado ? (cargaTopo >= 40 ? 5 : 2.5) : cargaTopo >= 20 ? 2.5 : 1
    const nova = arredondar(cargaTopo + incremento)
    return { carga: nova, reps: min, motivo: `Da última vez: ${resumo}. Bateu o topo da faixa (${max}) em todas: suba para ${formatarKg(nova)}.` }
  }

  if (Math.max(...reps) < min && !pesoCorporal) {
    const nova = Math.max(0, arredondar(cargaTopo * 0.95))
    return { carga: nova, reps: min, motivo: `Da última vez: ${resumo}, abaixo da faixa (${min}-${max}): reduza para ${formatarKg(nova)}.` }
  }

  const alvo = Math.min(max, Math.max(...reps) + 1)
  return { carga: cargaTopo, reps: alvo, motivo: `Da última vez: ${resumo}. Mantenha a carga e busque ${alvo} reps.` }
}

function formatarKg(v) {
  return v === 0 ? 'peso corporal' : `${String(v).replace('.', ',')} kg`
}

/**
 * Gera a sugestão de treino full body para o dia.
 * @param {object} p
 * @param {Array} p.exercicios  catálogo [{id, nome, grupo_muscular}]
 * @param {Array} p.historico   [{data, series:[{exercise_id, carga_kg, repeticoes, numero_serie}]}]
 * @param {string} p.hoje       AAAA-MM-DD
 */
export function gerarSugestao({ exercicios, historico, hoje }) {
  const padraoPorId = {}
  const exPorId = {}
  for (const ex of exercicios) {
    exPorId[ex.id] = ex
    padraoPorId[ex.id] = classificarPadrao(ex)
  }

  // Séries por exercício e data (datas anteriores a hoje)
  const porExercicio = {} // id -> { [data]: series[] }
  const seriesHoje = []
  for (const t of historico || []) {
    for (const s of t.series || []) {
      if (!s.exercise_id) continue
      if (t.data === hoje) { seriesHoje.push(s); continue }
      if (t.data > hoje) continue
      porExercicio[s.exercise_id] ??= {}
      ;(porExercicio[s.exercise_id][t.data] ??= []).push(s)
    }
  }
  const ultimaData = (id) => {
    const datas = Object.keys(porExercicio[id] || {})
    return datas.length ? datas.sort().at(-1) : null
  }

  // Último treino (antes de hoje) e exercícios feitos nele
  const datasTreino = (historico || []).filter((t) => t.data < hoje && t.series?.length).map((t) => t.data).sort()
  const ultimoTreino = datasTreino.at(-1)
  const feitosNoUltimo = new Set(
    (historico || []).filter((t) => t.data === ultimoTreino).flatMap((t) => t.series.map((s) => s.exercise_id))
  )

  // Séries da semana por padrão (inclui hoje)
  const semana = inicioDaSemanaISO(hoje)
  const seriesSemana = Object.fromEntries(Object.keys(PADROES).map((p) => [p, 0]))
  for (const t of historico || []) {
    if (t.data < semana || t.data > hoje) continue
    for (const s of t.series || []) {
      const p = padraoPorId[s.exercise_id]
      if (p) seriesSemana[p] += 1
    }
  }
  const atraso = (p) => seriesSemana[p] / PADROES[p].metaSemana

  // Exercícios já feitos hoje, por padrão
  const hojePorPadrao = {}
  for (const s of seriesHoje) {
    const p = padraoPorId[s.exercise_id]
    if (!p) continue
    ;(hojePorPadrao[p] ??= [])
    if (!hojePorPadrao[p].includes(s.exercise_id)) hojePorPadrao[p].push(s.exercise_id)
  }

  // 9 exercícios: base (agachar, quadril, empurrar, puxar), 2º de empurrar e puxar,
  // 2º de perna (o padrão mais atrasado na semana), core e acessório
  const pernaExtra = atraso('agachar') <= atraso('quadril') ? 'agachar' : 'quadril'
  const slots = ['agachar', 'quadril', 'empurrar', 'puxar', 'empurrar', 'puxar', pernaExtra, 'core', 'acessorio']

  const usados = new Set()
  const itens = slots.map((padrao, i) => {
    const candidatos = exercicios
      .filter((ex) => padraoPorId[ex.id] === padrao)
      .map((ex) => ({ ex, ultima: ultimaData(ex.id) }))
      .sort((a, b) => {
        // já feitos antes primeiro (permitem progressão), o menos recente na frente
        if (a.ultima && b.ultima) return a.ultima.localeCompare(b.ultima)
        if (a.ultima) return -1
        if (b.ultima) return 1
        return prioridadePreferida(a.ex, padrao) - prioridadePreferida(b.ex, padrao) || a.ex.nome.localeCompare(b.ex.nome)
      })

    // Segundo exercício do mesmo padrão: prefere o plano oposto (ex.: supino -> desenvolvimento)
    const anterior = slots.slice(0, i).includes(padrao)
      ? exPorId[[...usados].find((id) => padraoPorId[id] === padrao)]
      : null
    let ordenados = candidatos.filter((c) => !usados.has(c.ex.id))
    if (anterior) {
      const oposto = plano(anterior) === 'vertical' ? 'horizontal' : 'vertical'
      ordenados = [...ordenados.filter((c) => plano(c.ex) === oposto), ...ordenados.filter((c) => plano(c.ex) !== oposto)]
    }

    // Se já fez hoje um exercício desse padrão, fixa nele
    const feitoHojeId = (hojePorPadrao[padrao] || []).find((id) => !usados.has(id))
    let escolhido = feitoHojeId ? exPorId[feitoHojeId] : null
    if (!escolhido) {
      const semRepetir = ordenados.filter((c) => !feitosNoUltimo.has(c.ex.id))
      const comHistorico = semRepetir.filter((c) => c.ultima)
      escolhido = (comHistorico[0] ?? semRepetir[0] ?? ordenados[0])?.ex ?? null
    }
    if (!escolhido) return null
    usados.add(escolhido.id)

    const datas = porExercicio[escolhido.id] || {}
    const ultima = ultimaData(escolhido.id)
    const carga = sugerirCarga(ultima ? datas[ultima] : [], padrao)
    const [min, max] = PADROES[padrao].faixa
    const seriesFeitasHoje = seriesHoje.filter((s) => s.exercise_id === escolhido.id).length

    return {
      padrao,
      rotuloPadrao: PADROES[padrao].rotulo,
      exercicio: escolhido,
      series: PADROES[padrao].series,
      faixa: `${min}-${max}`,
      ...carga,
      seriesFeitasHoje,
      concluido: seriesFeitasHoje >= PADROES[padrao].series,
      alternativas: ordenados.map((c) => c.ex).filter((ex) => ex.id !== escolhido.id),
    }
  }).filter(Boolean)

  const resumoSemana = ['agachar', 'quadril', 'empurrar', 'puxar'].map((p) => ({
    padrao: p,
    rotulo: PADROES[p].rotulo,
    feitas: seriesSemana[p],
    meta: PADROES[p].metaSemana,
  }))

  return { itens, resumoSemana }
}

// Recalcula um item trocando o exercício (botão "Trocar")
export function itemComExercicio(item, exercicio, historico, hoje) {
  const series = []
  let ultima = null
  for (const t of historico || []) {
    if (t.data >= hoje) continue
    const doEx = (t.series || []).filter((s) => s.exercise_id === exercicio.id)
    if (doEx.length && (!ultima || t.data > ultima)) { ultima = t.data; series.length = 0; series.push(...doEx) }
  }
  const carga = sugerirCarga(series, item.padrao)
  return { ...item, exercicio, ...carga, seriesFeitasHoje: 0, concluido: false }
}
