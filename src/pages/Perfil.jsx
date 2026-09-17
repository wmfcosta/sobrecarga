import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

export default function Perfil() {
  const { profile, atualizarPerfil } = useAuth()
  const [idade, setIdade] = useState('')
  const [altura, setAltura] = useState('')
  const [peso, setPeso] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.getProfile().then((dados) => {
      setIdade(dados.idade != null ? String(dados.idade) : '')
      setAltura(dados.altura_cm != null ? String(dados.altura_cm) : '')
      setPeso(dados.peso_kg != null ? String(dados.peso_kg) : '')
      setCarregando(false)
    })
  }, [])

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    setSalvo(false)
    try {
      const atualizado = await api.updateProfile({
        idade: idade ? parseInt(idade, 10) : null,
        altura: altura ? parseFloat(altura) : null,
        peso: peso ? parseFloat(peso) : null,
      })
      atualizarPerfil(atualizado)
      setSalvo(true)
    } catch (err) {
      setErro(err.message)
    }
    setSalvando(false)
  }

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Perfil</h1>
          <p className="texto-secundario">{profile?.nome}</p>
        </div>
      </header>

      {carregando ? (
        <p className="texto-secundario">Carregando...</p>
      ) : (
        <form onSubmit={salvar} className="cartao form-inline">
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

          {erro && <p className="mensagem-erro">{erro}</p>}
          {salvo && <p className="texto-secundario">Perfil atualizado.</p>}

          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}
    </div>
  )
}
