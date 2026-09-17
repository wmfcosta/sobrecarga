import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = carregando, null = deslogado

  useEffect(() => {
    const token = api.getToken()
    const bruto = localStorage.getItem('ferro_user')
    if (token && bruto) {
      try {
        setUser(JSON.parse(bruto))
      } catch {
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }, [])

  function entrar(token, usuario) {
    api.setToken(token)
    localStorage.setItem('ferro_user', JSON.stringify(usuario))
    setUser(usuario)
  }

  function signOut() {
    api.setToken(null)
    localStorage.removeItem('ferro_user')
    setUser(null)
  }

  function atualizarPerfil(dadosNovos) {
    setUser((atual) => {
      const atualizado = { ...atual, ...dadosNovos }
      localStorage.setItem('ferro_user', JSON.stringify(atualizado))
      return atualizado
    })
  }

  const value = {
    user,
    profile: user,
    loading: user === undefined,
    entrar,
    signOut,
    atualizarPerfil,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
