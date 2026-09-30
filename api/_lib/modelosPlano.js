// Modelos de plano disponíveis no app (qualquer usuário pode ativar para si).
//
// "Avançado ABCDE": baseado na planilha Treino Avançado Masculino (rotação semanal).
// Consolidado em uma única versão, sem divisão por semana: a lista de exercícios
// das semanas 1-8, que é a que mais se repete ao longo do programa.
//
// Cada exercício:
//   nome      -> nome no cadastro (exercises). Se não existir, é criado.
//   aliases   -> nomes já cadastrados que valem como o mesmo exercício (mantém histórico)
//   grupo     -> grupo muscular usado ao criar no cadastro
//   series    -> séries de trabalho registradas (sem contar o aquecimento)
//   reps      -> faixa de repetições das séries de trabalho
//   obs       -> estrutura completa das séries (feeder / working / back-off / técnicas)

const F = 'Feeder 5-6'

export const MODELOS_PLANO = {
  avancado: {
    id: 'avancado',
    nome: 'Avançado ABCDE',
    descricao:
      '5 treinos (A a E), 5 dias por semana. O treino que abre a semana muda a cada semana: ' +
      'A-B-C-D-E, depois B-C-D-E-A, e assim por diante. Aquecimento de 2x 15-20 reps só no 1º exercício. ' +
      'Feeders são séries de aproximação; a progressão de carga vale para as séries de trabalho (working).',
    dias: [
      {
        rotulo: 'Treino A - Peito e Tríceps',
        exercicios: [
          { nome: 'Supino inclinado', grupo: 'Peito', series: 5, reps: '6-8', obs: `Aquecimento 2x 15-20 · ${F} x2 · Working 6-8 · Working cluster (3-4 blocos de 3-4 reps, 20s) · Back-off 10-12. Halter, Smith ou máquina` },
          { nome: 'Supino reto', grupo: 'Peito', series: 5, reps: '8-10', obs: `${F} x2 · Working 8-10 x2 · Back-off 10-12. Halter, Smith ou máquina` },
          { nome: 'Crucifixo reto', aliases: ['Crucifixo'], grupo: 'Peito', series: 5, reps: '8-10', obs: `${F} x2 · Working 8-10 · Working cluster (3-4 blocos de 3-4 reps) · Back-off 10-12. Halter, cabo ou máquina` },
          { nome: 'Crossover', aliases: ['Crucifixo declinado', 'Crossover/Crucifixo declinado'], grupo: 'Peito', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Drop set 6-6-6 (18 reps). Pode trocar por crucifixo declinado` },
          { nome: 'Elevação lateral', grupo: 'Ombro', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Halter` },
          { nome: 'Tríceps testa', grupo: 'Tríceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Barra W` },
          { nome: 'Tríceps francês', grupo: 'Tríceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Halter no banco` },
          { nome: 'Tríceps corda', grupo: 'Tríceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Drop set 6-6-6 (18 reps). No cabo` },
        ],
      },
      {
        rotulo: 'Treino B - Quadríceps e Panturrilha',
        exercicios: [
          { nome: 'Cadeira abdutora', grupo: 'Pernas', series: 4, reps: '10-12', obs: `Aquecimento 2x 15-20 · ${F} · Working 10-12 x3` },
          { nome: 'Cadeira extensora', grupo: 'Pernas', series: 5, reps: '10-12', obs: `${F} · Working 10-12 x3 · Back-off 10-12` },
          { nome: 'Agachamento livre', aliases: ['Agachamento', 'Agachamento hack', 'Agachamento smith'], grupo: 'Pernas', series: 5, reps: '10-12', obs: `${F} x2 · Working 10-12 x2 · Back-off 10-12. Smith, livre ou hack` },
          { nome: 'Avanço', aliases: ['Afundo', 'Avanço/Afundo'], grupo: 'Pernas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Livre, halter ou Smith` },
          { nome: 'Leg press', grupo: 'Pernas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Drop set 6-6-6 (18 reps)` },
          { nome: 'Panturrilha em pé', grupo: 'Panturrilha', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3` },
          { nome: 'Panturrilha no leg press', aliases: ['Panturrilha sentado'], grupo: 'Panturrilha', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Pode ser sentado` },
          { nome: 'Abdominal crunch', grupo: 'Abdômen', series: 4, reps: '15-20', obs: '4x 15-20 com peso' },
          { nome: 'Elevação de pernas na barra', aliases: ['Elevação de membros inferiores em suspensão'], grupo: 'Abdômen', series: 4, reps: '20-25', obs: '4x 20-25. Elevação de membros inferiores em suspensão' },
        ],
      },
      {
        rotulo: 'Treino C - Costas e Bíceps',
        exercicios: [
          { nome: 'Puxada alta supinada aberta', grupo: 'Costas', series: 5, reps: '10-12', obs: `Aquecimento 2x 15-20 · ${F} x2 · Working 10-12 x2 · Back-off 12-15` },
          { nome: 'Puxada alta com triângulo', grupo: 'Costas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Back-off 12-15` },
          { nome: 'Remada curvada supinada', aliases: ['Remada curvada'], grupo: 'Costas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Back-off 12-15. Pegada supinada` },
          { nome: 'Remada baixa com triângulo', aliases: ['Remada baixa'], grupo: 'Costas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Rest-pause (3 blocos de 4 reps, 5s de pausa). Com triângulo` },
          { nome: 'Pulldown', aliases: ['Pull down'], grupo: 'Costas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Drop set 6-6-6 (18 reps)` },
          { nome: 'Crucifixo inverso', grupo: 'Ombro', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Halter` },
          { nome: 'Rosca alternada banco 45°', aliases: ['Rosca alternada'], grupo: 'Bíceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Banco a 45°` },
          { nome: 'Rosca Scott', grupo: 'Bíceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3` },
        ],
      },
      {
        rotulo: 'Treino D - Posteriores e Glúteo',
        exercicios: [
          { nome: 'Cadeira flexora', grupo: 'Pernas', series: 4, reps: '10-12', obs: `Aquecimento 2x 15-20 · ${F} · Working 10-12 x3` },
          { nome: 'Mesa flexora', grupo: 'Pernas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3` },
          { nome: 'Stiff', grupo: 'Pernas', series: 5, reps: '10-12', obs: `${F} x2 · Working 10-12 x2 · Back-off 10-12. Barra ou halter` },
          { nome: 'Agachamento búlgaro', grupo: 'Pernas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3` },
          { nome: 'Elevação pélvica', aliases: ['Elevação de quadril'], grupo: 'Pernas', series: 4, reps: '10-12', obs: `${F} · Working 10-12 · Working cluster (3-4 blocos de 3-4 reps, 20s) · Back-off 10-12` },
          { nome: 'Panturrilha no leg press', aliases: ['Panturrilha sentado'], grupo: 'Panturrilha', series: 5, reps: '10-12', obs: `${F} · Working 10-12 x3 · Rest-pause (3 blocos de 4 reps, 5s de pausa)` },
          { nome: 'Abdominal crunch', grupo: 'Abdômen', series: 4, reps: '15-20', obs: '4x 15-20 com peso' },
          { nome: 'Elevação de pernas na barra', aliases: ['Elevação de membros inferiores em suspensão'], grupo: 'Abdômen', series: 4, reps: '15-20', obs: '4x 15-20. Elevação de membros inferiores em suspensão' },
        ],
      },
      {
        rotulo: 'Treino E - Ombros e Braços',
        exercicios: [
          { nome: 'Desenvolvimento com halteres', aliases: ['Desenvolvimento'], grupo: 'Ombro', series: 5, reps: '6-8', obs: `Aquecimento 2x 15-20 · ${F} x2 · Working 6-8 · Working cluster (3-4 blocos de 3-4 reps) · Back-off 10-12. Halteres` },
          { nome: 'Elevação lateral', grupo: 'Ombro', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Halter` },
          { nome: 'Elevação frontal', grupo: 'Ombro', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Banco a 75°` },
          { nome: 'Crucifixo inverso', grupo: 'Ombro', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Banco a 75°` },
          { nome: 'Tríceps francês', grupo: 'Tríceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Cabo ou halter` },
          { nome: 'Tríceps testa', grupo: 'Tríceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3. Barra W ou halter` },
          { nome: 'Tríceps corda', grupo: 'Tríceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Drop set 6-6-6 (18 reps)` },
          { nome: 'Rosca Scott', grupo: 'Bíceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3` },
          { nome: 'Rosca martelo', grupo: 'Bíceps', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x2 · Drop set 6-6-6 (18 reps). Na corda` },
          { nome: 'Panturrilha no leg press', aliases: ['Panturrilha sentado'], grupo: 'Panturrilha', series: 4, reps: '10-12', obs: `${F} · Working 10-12 x3, cada uma + 10 reps parciais em alongamento` },
        ],
      },
    ],
  },
}

export function norm(txt) {
  return (txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

export function resumoModelos() {
  return Object.values(MODELOS_PLANO).map((m) => ({
    id: m.id,
    nome: m.nome,
    descricao: m.descricao,
    dias: m.dias.map((d) => ({
      rotulo: d.rotulo,
      exercicios: d.exercicios.map((e) => ({ exercicio_nome: e.nome, series_alvo: e.series, repeticoes_alvo: e.reps, observacoes: e.obs })),
    })),
  }))
}

// ---------- Estrutura série a série (usada na tela de Treino do dia) ----------
// tipo: aquecimento | feeder | working | backoff. `nota` descreve a técnica da série
// (cluster, drop set, rest-pause, parciais). A ordem das linhas é a ordem de execução.

const aq = { tipo: 'aquecimento', reps: '15-20' }
const fd = { tipo: 'feeder', reps: '5-6' }
const wk = (reps = '10-12', nota) => (nota ? { tipo: 'working', reps, nota } : { tipo: 'working', reps })
const bo = (reps = '10-12') => ({ tipo: 'backoff', reps })
const CLUSTER = wk('3-4', 'Cluster: 3-4 blocos de 3-4 reps, 20s entre blocos')
const DROP = wk('6-6-6', 'Drop set: 6 reps, reduz a carga, 6, reduz, 6 (18 no total)')
const REST_PAUSE = wk('4+4+4', 'Rest-pause: 3 blocos de 4 reps, 5s de pausa')
const w3 = [wk(), wk(), wk()]

const ESTRUTURA_AVANCADO = [
  // Treino A - Peito e Tríceps
  [
    [aq, aq, fd, fd, wk('6-8'), CLUSTER, bo()],
    [fd, fd, wk('8-10'), wk('8-10'), bo()],
    [fd, fd, wk('8-10'), CLUSTER, bo()],
    [fd, wk(), wk(), DROP],
    [fd, ...w3],
    [fd, ...w3],
    [fd, ...w3],
    [fd, wk(), wk(), DROP],
  ],
  // Treino B - Quadríceps e Panturrilha
  [
    [aq, aq, fd, ...w3],
    [fd, ...w3, bo()],
    [fd, fd, wk(), wk(), bo()],
    [fd, ...w3],
    [fd, wk(), wk(), DROP],
    [fd, ...w3],
    [fd, ...w3],
    [wk('15-20'), wk('15-20'), wk('15-20'), wk('15-20')],
    [wk('20-25'), wk('20-25'), wk('20-25'), wk('20-25')],
  ],
  // Treino C - Costas e Bíceps
  [
    [aq, aq, fd, fd, wk(), wk(), bo('12-15')],
    [fd, wk(), wk(), bo('12-15')],
    [fd, wk(), wk(), bo('12-15')],
    [fd, wk(), wk(), REST_PAUSE],
    [fd, wk(), wk(), DROP],
    [fd, ...w3],
    [fd, ...w3],
    [fd, ...w3],
  ],
  // Treino D - Posteriores e Glúteo
  [
    [aq, aq, fd, ...w3],
    [fd, ...w3],
    [fd, fd, wk(), wk(), bo()],
    [fd, ...w3],
    [fd, wk(), CLUSTER, bo()],
    [fd, ...w3, REST_PAUSE],
    [wk('15-20'), wk('15-20'), wk('15-20'), wk('15-20')],
    [wk('15-20'), wk('15-20'), wk('15-20'), wk('15-20')],
  ],
  // Treino E - Ombros e Braços
  [
    [aq, aq, fd, fd, wk('6-8'), CLUSTER, bo()],
    [fd, ...w3],
    [fd, ...w3],
    [fd, ...w3],
    [fd, ...w3],
    [fd, ...w3],
    [fd, wk(), wk(), DROP],
    [fd, ...w3],
    [fd, wk(), wk(), DROP],
    [fd, ...[1, 2, 3].map(() => wk('10-12', '+ 10 reps parciais em alongamento'))],
  ],
]

MODELOS_PLANO.avancado.dias.forEach((dia, i) => {
  dia.exercicios.forEach((ex, j) => {
    ex.estrutura = ESTRUTURA_AVANCADO[i][j]
  })
})

// Estrutura de um exercício de um plano ativado a partir de um modelo
export function estruturaDoModelo(modeloId, indiceDia, indiceExercicio) {
  return MODELOS_PLANO[modeloId]?.dias[indiceDia]?.exercicios[indiceExercicio]?.estrutura ?? null
}

// Descobre o modelo de um plano (planos antigos não guardavam o modelo, só o nome)
export function modeloDoPlano(plano) {
  if (plano?.modelo && MODELOS_PLANO[plano.modelo]) return plano.modelo
  const encontrado = Object.values(MODELOS_PLANO).find((m) => m.nome === plano?.nome)
  return encontrado?.id ?? null
}
