self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// ---------- Cronômetro de descanso ----------
// A página agenda o fim do descanso aqui. O service worker continua rodando
// alguns minutos mesmo com o app em segundo plano ou a tela bloqueada, então
// a notificação chega no horário mesmo se o usuário saiu do app.
let temporizador = null
let liberarEvento = null

function cancelarAgendamento() {
  if (temporizador) clearTimeout(temporizador)
  temporizador = null
  if (liberarEvento) liberarEvento()
  liberarEvento = null
}

self.addEventListener('message', (event) => {
  const msg = event.data || {}

  if (msg.tipo === 'cancelar-descanso') {
    cancelarAgendamento()
    return
  }

  if (msg.tipo === 'agendar-descanso') {
    cancelarAgendamento()
    const espera = Math.max(0, msg.fimEm - Date.now())
    event.waitUntil(
      new Promise((resolve) => {
        liberarEvento = resolve
        temporizador = setTimeout(async () => {
          temporizador = null
          try {
            await self.registration.showNotification('Descanso encerrado 💪', {
              body: msg.corpo || 'Hora da próxima série!',
              tag: 'descanso',
              renotify: true,
              requireInteraction: true,
              vibrate: [400, 150, 400, 150, 400],
              icon: '/icone-96.png',
              badge: '/icone-96.png',
            })
          } catch {
            // sem permissão de notificação: a página mostra o aviso ao voltar
          }
          liberarEvento = null
          resolve()
        }, espera)
      })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((j) => 'focus' in j)
      if (aberta) return aberta.focus()
      return self.clients.openWindow('/')
    })
  )
})
