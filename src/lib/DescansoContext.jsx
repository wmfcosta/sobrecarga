import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Cronômetro de descanso entre séries.
// O estado (horário de término) fica no localStorage, então o cronômetro
// sobrevive a troca de tela e recarregamento da página. A notificação é
// agendada no service worker para chegar mesmo com o app em segundo plano.

const CHAVE = 'sobrecarga_descanso'
const DescansoContext = createContext(null)

function lerSalvo() {
  try {
    const bruto = localStorage.getItem(CHAVE)
    const salvo = bruto ? JSON.parse(bruto) : null
    // descanso encerrado há mais de 10 min não interessa mais
    if (salvo && Date.now() - salvo.fimEm > 10 * 60 * 1000) return null
    return salvo
  } catch {
    return null
  }
}

function salvar(estado) {
  try {
    if (estado) localStorage.setItem(CHAVE, JSON.stringify(estado))
    else localStorage.removeItem(CHAVE)
  } catch {
    // armazenamento indisponível: o cronômetro funciona só em memória
  }
}

async function enviarAoServiceWorker(mensagem) {
  if (!('serviceWorker' in navigator)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const alvo = navigator.serviceWorker.controller || reg.active
    if (!alvo) return false
    alvo.postMessage(mensagem)
    return true
  } catch {
    return false
  }
}

export function DescansoProvider({ children }) {
  // { fimEm, duracaoMs, rotulo, alertado }
  const [descanso, setDescanso] = useState(() => lerSalvo())
  const [agora, setAgora] = useState(() => Date.now())
  const [permissao, setPermissao] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const audioRef = useRef(null)
  const swAgendou = useRef(typeof navigator !== 'undefined' && 'serviceWorker' in navigator)

  const atualizar = useCallback((novo) => {
    setDescanso(novo)
    salvar(novo)
  }, [])

  // Toca 3 bipes curtos (o AudioContext é liberado no toque de "Registrar série")
  const tocarAlarme = useCallback(() => {
    try {
      const ctx = audioRef.current
      if (ctx) {
        ;[0, 0.35, 0.7].forEach((atraso) => {
          const osc = ctx.createOscillator()
          const ganho = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = 880
          ganho.gain.setValueAtTime(0.0001, ctx.currentTime + atraso)
          ganho.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + atraso + 0.02)
          ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + atraso + 0.25)
          osc.connect(ganho).connect(ctx.destination)
          osc.start(ctx.currentTime + atraso)
          osc.stop(ctx.currentTime + atraso + 0.3)
        })
      }
    } catch {
      // sem áudio disponível
    }
    try {
      navigator.vibrate?.([400, 150, 400, 150, 400])
    } catch {
      // sem vibração
    }
  }, [])

  const iniciar = useCallback(
    async (minutos, rotulo) => {
      const duracaoMs = Math.round(Number(minutos) * 60 * 1000)
      if (!duracaoMs || duracaoMs <= 0) return

      // Libera o áudio enquanto ainda estamos dentro do toque do usuário
      try {
        if (!audioRef.current) {
          const Ctx = window.AudioContext || window.webkitAudioContext
          if (Ctx) audioRef.current = new Ctx()
        }
        audioRef.current?.resume?.()
      } catch {
        // ignora
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        try {
          const resp = await Notification.requestPermission()
          setPermissao(resp)
        } catch {
          // ignora
        }
      }

      const fimEm = Date.now() + duracaoMs
      const novo = { fimEm, duracaoMs, rotulo, alertado: false }
      atualizar(novo)
      setAgora(Date.now())
      swAgendou.current = await enviarAoServiceWorker({
        tipo: 'agendar-descanso',
        fimEm,
        corpo: rotulo ? `Próxima série: ${rotulo}` : 'Hora da próxima série!',
      })
    },
    [atualizar]
  )

  const cancelar = useCallback(() => {
    atualizar(null)
    enviarAoServiceWorker({ tipo: 'cancelar-descanso' })
  }, [atualizar])

  const adicionarSegundos = useCallback(
    (segundos) => {
      setDescanso((atual) => {
        if (!atual) return atual
        const base = Math.max(atual.fimEm, Date.now())
        const novo = {
          ...atual,
          fimEm: base + segundos * 1000,
          duracaoMs: atual.duracaoMs + segundos * 1000,
          alertado: false,
        }
        salvar(novo)
        enviarAoServiceWorker({
          tipo: 'agendar-descanso',
          fimEm: novo.fimEm,
          corpo: novo.rotulo ? `Próxima série: ${novo.rotulo}` : 'Hora da próxima série!',
        })
        return novo
      })
    },
    []
  )

  // Relógio da tela
  useEffect(() => {
    if (!descanso) return
    const id = setInterval(() => setAgora(Date.now()), 250)
    return () => clearInterval(id)
  }, [descanso])

  // Ao voltar para o app, atualiza imediatamente
  useEffect(() => {
    function aoVoltar() {
      setAgora(Date.now())
      if (typeof Notification !== 'undefined') setPermissao(Notification.permission)
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [])

  // Chegou a zero: alarme na tela (e notificação direta se não houver service worker)
  useEffect(() => {
    if (!descanso || descanso.alertado || agora < descanso.fimEm) return
    const atrasado = agora - descanso.fimEm > 60 * 1000
    if (document.visibilityState === 'visible' && !atrasado) tocarAlarme()
    if (!swAgendou.current && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Descanso encerrado 💪', {
          body: descanso.rotulo ? `Próxima série: ${descanso.rotulo}` : 'Hora da próxima série!',
          tag: 'descanso',
          icon: '/icone-96.png',
        })
      } catch {
        // alguns navegadores só aceitam notificação via service worker
      }
    }
    atualizar({ ...descanso, alertado: true })
  }, [agora, descanso, tocarAlarme, atualizar])

  const restanteMs = descanso ? Math.max(0, descanso.fimEm - agora) : 0

  const value = {
    descanso,
    restanteMs,
    encerrado: !!descanso && restanteMs === 0,
    permissao,
    iniciar,
    cancelar,
    adicionarSegundos,
  }

  return <DescansoContext.Provider value={value}>{children}</DescansoContext.Provider>
}

export function useDescanso() {
  return useContext(DescansoContext)
}
