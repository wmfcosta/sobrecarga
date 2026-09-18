const TOKEN_KEY = 'ferro_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const dados = await res.json().catch(() => ({}))
  if (!res.ok) {
    const erro = new Error(dados.error || 'Erro na requisição')
    erro.status = res.status
    throw erro
  }
  return dados
}

export const api = {
  signup: (nome, email, senha, extras = {}) =>
    request('/auth/signup', { method: 'POST', body: { nome, email, senha, ...extras } }),
  login: (email, senha) => request('/auth/login', { method: 'POST', body: { email, senha } }),
  listExercises: () => request('/exercises'),
  createExercise: (nome, grupo_muscular) =>
    request('/exercises', { method: 'POST', body: { nome, grupo_muscular }, auth: true }),
  getWorkout: (data) => request(`/workouts?data=${encodeURIComponent(data)}`, { auth: true }),
  ensureWorkout: (data) => request('/workouts', { method: 'POST', body: { data }, auth: true }),
  createSet: (payload) => request('/workout-sets', { method: 'POST', body: payload, auth: true }),
  updateSet: (payload) => request('/workout-sets', { method: 'PUT', body: payload, auth: true }),
  deleteSet: (id) => request(`/workout-sets?id=${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  getHistory: () => request('/history', { auth: true }),
  getProfile: () => request('/profile', { auth: true }),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: payload, auth: true }),
  listAssessments: () => request('/assessments', { auth: true }),
  saveAssessment: (payload) => request('/assessments', { method: 'POST', body: payload, auth: true }),
  deleteAssessment: (id) => request(`/assessments?id=${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  listStudents: () => request('/students', { auth: true }),
  getMyPlan: () => request('/plans', { auth: true }),
  getStudentPlan: (alunoId) => request(`/plans?aluno_id=${encodeURIComponent(alunoId)}`, { auth: true }),
  savePlan: (payload) => request('/plans', { method: 'POST', body: payload, auth: true }),
  deletePlan: (id) => request(`/plans?id=${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  getToken,
  setToken,
}
