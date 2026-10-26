// Dupla progressão: a partir do último treino do exercício, sugere a carga de hoje.
// Regras (documento "Treinos de progressão de carga por grupo muscular"):
// - todas as séries na mesma carga e no topo da faixa → sobe um degrau;
// - na carga mais alta ficou mais de 2 repetições abaixo do mínimo da faixa → reduz ~5%;
// - senão → mantém a carga mais alta e busca o topo da faixa em todas as séries.

function faixa(reps) {
  const nums = String(reps || '').match(/\d+/g)?.map(Number) ?? []
  if (!nums.length) return null
  return { min: nums[0], max: nums.at(-1) }
}

function arredondar(valor, degrau) {
  return Math.max(degrau, Math.round(valor / degrau) * degrau)
}

const kg = (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })

// estrutura: séries prescritas [{reps:'8-12', degrau:5}, …]; anterior: [{carga_kg, repeticoes}, …]
export function sugerirProgressao(estrutura, anterior) {
  const degrau = Number(estrutura?.[0]?.degrau)
  const f = faixa(estrutura?.[0]?.reps)
  if (!degrau || !f) return null
  const n = estrutura.length
  const ult = (anterior || [])
    .filter((s) => s.carga_kg != null && s.repeticoes != null)
    .map((s) => ({ carga: Number(s.carga_kg), reps: Number(s.repeticoes) }))

  if (!ult.length) {
    return { acao: 'novo', carga: null, texto: `escolha uma carga para fazer ${f.min} a ${f.max} repetições.` }
  }

  const ref = Math.max(...ult.map((s) => s.carga))
  const naRef = ult.filter((s) => s.carga === ref)
  const ultimoTexto = ult.map((s) => `${kg(s.carga)}×${s.reps}`).join(', ')

  // Reduz só quando ficou bem abaixo da faixa (mais de 2 repetições); perto dela, mantém
  if (naRef.some((s) => s.reps < f.min - 2)) {
    const carga = arredondar(ref * 0.95, degrau)
    return {
      acao: 'reduzir',
      carga: carga < ref ? carga : Math.max(degrau, ref - degrau),
      texto: `para ${kg(carga < ref ? carga : Math.max(degrau, ref - degrau))} kg. Com ${kg(ref)} kg ficou abaixo de ${f.min} repetições. Último: ${ultimoTexto}.`,
    }
  }

  const todasIguais = ult.every((s) => s.carga === ref)
  if (todasIguais && ult.length >= n && ult.every((s) => s.reps >= f.max)) {
    return {
      acao: 'subir',
      carga: ref + degrau,
      texto: `para ${kg(ref + degrau)} kg. Você fez ${ult.length} × ${f.max}+ com ${kg(ref)} kg; volte a ${f.min}–${f.max} reps.`,
    }
  }

  const alvo = todasIguais
    ? `buscar ${f.max} repetições em todas as séries`
    : `fazer as ${n} séries com a mesma carga`
  return { acao: 'manter', carga: ref, texto: `${kg(ref)} kg e ${alvo}. Último: ${ultimoTexto}.` }
}
