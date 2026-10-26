// Cálculos da tela Progressão (mesma lógica da planilha "exercícios e cargas").
// Entrada: o histórico de /api/history (treinos com suas séries).

export function nomeLimpo(nome) {
  return (nome || '').replace(/\s+/g, ' ').trim()
}

function mediana(valores) {
  const v = [...valores].sort((a, b) => a - b)
  if (!v.length) return 0
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

// Achata o histórico em séries de musculação e de cardio, filtrando pelo período
export function separarSeries(treinos, desdeISO = null) {
  const forca = []
  const cardio = []
  for (const t of treinos || []) {
    if (desdeISO && t.data < desdeISO) continue
    for (const s of t.series || []) {
      const base = {
        id: s.id,
        data: t.data,
        exercicio: nomeLimpo(s.exercicio_nome),
        grupo: s.grupo_muscular || 'Sem grupo',
        serie: s.numero_serie,
        tipo: s.tipo_serie || null,
      }
      if (s.tempo_min != null || s.carga_kg == null) {
        cardio.push({ ...base, tempo: s.tempo_min != null ? Number(s.tempo_min) : null, calorias: s.calorias ?? null })
      } else {
        const carga = Number(s.carga_kg)
        const reps = s.repeticoes ?? 0
        forca.push({ ...base, carga, reps, volume: carga * reps })
      }
    }
  }
  const porDataSerie = (a, b) => a.data.localeCompare(b.data) || a.exercicio.localeCompare(b.exercicio) || a.serie - b.serie
  forca.sort(porDataSerie)
  cardio.sort(porDataSerie)
  return { forca, cardio }
}

// Marca séries com cara de erro de digitação: repetições muito altas ou carga
// muito fora do padrão do próprio exercício.
export function marcarSuspeitas(forca) {
  const cargasPorEx = {}
  for (const s of forca) (cargasPorEx[s.exercicio] ??= []).push(s.carga)
  const med = Object.fromEntries(Object.entries(cargasPorEx).map(([ex, v]) => [ex, mediana(v)]))
  return forca.map((s) => {
    const m = med[s.exercicio]
    let alerta = null
    if (s.reps > 30) alerta = `${s.reps} repetições`
    else if (m > 0 && cargasPorEx[s.exercicio].length >= 4 && (s.carga > m * 2.5 || s.carga < m / 3)) {
      alerta = `carga fora do padrão (mediana ${formatarKg(m)} kg)`
    }
    return alerta ? { ...s, alerta } : s
  })
}

// Uma linha por exercício por dia
export function agruparPorTreino(forca) {
  const mapa = new Map()
  for (const s of forca) {
    const chave = `${s.exercicio}|${s.data}`
    if (!mapa.has(chave)) mapa.set(chave, { exercicio: s.exercicio, grupo: s.grupo, data: s.data, series: [] })
    mapa.get(chave).series.push(s)
  }
  return [...mapa.values()].map((d) => {
    const cargas = d.series.map((s) => s.carga)
    return {
      ...d,
      qtd: d.series.length,
      min: Math.min(...cargas),
      max: Math.max(...cargas),
      volume: d.series.reduce((n, s) => n + s.volume, 0),
      alertas: d.series.filter((s) => s.alerta).length,
    }
  })
}

// Ranking: um resumo por exercício
export function montarRanking(porTreino) {
  const mapa = new Map()
  for (const d of porTreino) {
    if (!mapa.has(d.exercicio)) mapa.set(d.exercicio, { exercicio: d.exercicio, grupo: d.grupo, dias: [] })
    mapa.get(d.exercicio).dias.push(d)
  }
  return [...mapa.values()].map((e) => {
    const dias = e.dias.sort((a, b) => a.data.localeCompare(b.data))
    const primeiro = dias[0]
    const ultimo = dias[dias.length - 1]
    return {
      exercicio: e.exercicio,
      grupo: e.grupo,
      dias,
      treinos: dias.length,
      series: dias.reduce((n, d) => n + d.qtd, 0),
      primeiro: primeiro.data,
      ultimo: ultimo.data,
      min: Math.min(...dias.map((d) => d.min)),
      max: Math.max(...dias.map((d) => d.max)),
      maxPrimeiro: primeiro.max,
      maxUltimo: ultimo.max,
      evolucao: ultimo.max - primeiro.max,
      volume: dias.reduce((n, d) => n + d.volume, 0),
      alertas: dias.reduce((n, d) => n + d.alertas, 0),
    }
  })
}

export function ordenarRanking(lista, campo, direcao) {
  const fator = direcao === 'asc' ? 1 : -1
  return [...lista].sort((a, b) => {
    const va = a[campo]
    const vb = b[campo]
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb
    if (cmp !== 0) return cmp * fator
    // desempate padrão: mais treinos, mais séries, nome
    return b.treinos - a.treinos || b.series - a.series || a.exercicio.localeCompare(b.exercicio)
  })
}

export function formatarKg(v) {
  if (v == null || Number.isNaN(v)) return '-'
  return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

export function formatarData(iso) {
  if (!iso) return '-'
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a.slice(2)}`
}

// CSV com ";" e vírgula decimal (abre direto no Excel em português)
export function gerarCSV(cabecalho, linhas) {
  const esc = (v) => {
    const t = v == null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v)
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  return '﻿' + [cabecalho, ...linhas].map((l) => l.map(esc).join(';')).join('\r\n')
}
