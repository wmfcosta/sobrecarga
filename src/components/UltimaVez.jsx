// Mostra, ao escolher um exercício, as séries da última vez em que ele foi feito
// (antes do dia aberto na tela) e oferece atalhos de progressão: repetir,
// +1 repetição com a mesma carga ou +carga com as mesmas repetições.

const kg = (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })

function formatarData(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

// Degrau de carga: halteres leves sobem de 1 kg; o resto, de 2,5 kg
function degrauDe(carga) {
  return carga < 10 ? 1 : 2.5
}

export default function UltimaVez({ sessao, serieNumero, onEscolher }) {
  if (!sessao) {
    return <p className="ultima-vez ultima-vez-vazia">Primeira vez neste exercício: escolha uma carga confortável.</p>
  }

  const cardio = sessao.series.some((s) => s.tempo_min != null)
  // Referência: a mesma série da última vez; se hoje já passou do total, a última feita
  const numero = Number(serieNumero) || 1
  const ref = sessao.series.find((s) => s.numero_serie === numero) ?? sessao.series.at(-1)

  if (cardio) {
    return (
      <div className="ultima-vez">
        <p className="ultima-vez-titulo">Última vez · {formatarData(sessao.data)}</p>
        <p className="ultima-vez-series">
          {sessao.series.map((s) => `${kg(s.tempo_min)} min · ${s.calorias ?? '-'} kcal`).join('  |  ')}
        </p>
        <div className="ultima-vez-acoes">
          <button type="button" onClick={() => onEscolher({ tempoMin: ref.tempo_min, calorias: ref.calorias })}>
            Repetir
          </button>
        </div>
      </div>
    )
  }

  const carga = Number(ref.carga_kg)
  const reps = Number(ref.repeticoes)
  const degrau = degrauDe(carga)

  return (
    <div className="ultima-vez">
      <p className="ultima-vez-titulo">Última vez · {formatarData(sessao.data)}</p>
      <ul className="ultima-vez-series">
        {sessao.series.map((s) => (
          <li key={s.id} className={s === ref ? 'ultima-vez-ref' : ''}>
            <small>S{s.numero_serie}</small> {kg(s.carga_kg)}<small>kg</small> × {s.repeticoes}
          </li>
        ))}
      </ul>
      <p className="ultima-vez-dica">Para a série {numero}:</p>
      <div className="ultima-vez-acoes">
        <button type="button" onClick={() => onEscolher({ carga, reps })}>
          Repetir<br /><strong>{kg(carga)} × {reps}</strong>
        </button>
        <button type="button" onClick={() => onEscolher({ carga, reps: reps + 1 })}>
          +1 rep<br /><strong>{kg(carga)} × {reps + 1}</strong>
        </button>
        <button type="button" className="ultima-vez-subir" onClick={() => onEscolher({ carga: carga + degrau, reps })}>
          +{kg(degrau)} kg<br /><strong>{kg(carga + degrau)} × {reps}</strong>
        </button>
      </div>
    </div>
  )
}
