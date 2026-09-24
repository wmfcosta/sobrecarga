import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

export default function Entrar() {
  const { entrar } = useAuth()
  const [modo, setModo] = useState('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [idade, setIdade] = useState('')
  const [altura, setAltura] = useState('')
  const [peso, setPeso] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const resposta = modo === 'cadastro'
        ? await api.signup(nome, email, senha, {
            idade: idade ? parseInt(idade, 10) : null,
            altura: altura ? parseFloat(altura) : null,
            peso: peso ? parseFloat(peso) : null,
          })
        : await api.login(email, senha)
      entrar(resposta.token, resposta.user)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="tela-auth">
      <div className="cartao-auth">
        <img src="/logo.png" alt="Sobrecarga: acompanhamento de treino de musculação" className="logo-auth" width="900" height="640" />
        <h1>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="texto-secundario">
          {modo === 'login' ? 'Continue registrando sua carga.' : 'Cadastre-se para começar a registrar seus treinos.'}
        </p>

        <form onSubmit={handleSubmit} className="form-auth">
          {modo === 'cadastro' && (
            <>
              <label className="campo">
                <span>Nome</span>
                <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Seu nome" />
              </label>
              <div className="linha-tres-campos">
                <label className="campo">
                  <span>Idade</span>
                  <input inputMode="numeric" type="number" min="1" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="anos" />
                </label>
                <label className="campo">
                  <span>Altura (cm)</span>
                  <input inputMode="decimal" type="number" step="0.1" min="0" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="170" />
                </label>
                <label className="campo">
                  <span>Peso (kg)</span>
                  <input inputMode="decimal" type="number" step="0.1" min="0" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="70" />
                </label>
              </div>
            </>
          )}
          <label className="campo">
            <span>E-mail</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@email.com" />
          </label>
          <label className="campo">
            <span>Senha</span>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} placeholder="mínimo 6 caracteres" />
          </label>

          {erro && <p className="mensagem-erro">{erro}</p>}

          <button className="botao-primario" type="submit" disabled={carregando}>
            {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button className="botao-link" onClick={() => setModo(modo === 'login' ? 'cadastro' : 'login')}>
          {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
