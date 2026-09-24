import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

export default function Perfil() {
  const { profile, atualizarPerfil } = useAuth()
  const [idade, setIdade] = useState('')
  const [altura, setAltura] = useState('')
  const [peso, setPeso] = useState('')
  const [descanso, setDescanso] = useState('')
  const [fullbody, setFullbody] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.getProfile().then((dados) => {
      setIdade(dados.idade != null ? String(dados.idade) : '')
      setAltura(dados.altura_cm != null ? String(dados.altura_cm) : '')
      setPeso(dados.peso_kg != null ? String(dados.peso_kg) : '')
      setDescanso(dados.descanso_min != null ? String(Number(dados.descanso_min)) : '')
      setFullbody(dados.fullbody_ativo === true)
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
        descanso_min: descanso ? parseFloat(descanso.replace(',', '.')) : null,
        fullbody_ativo: fullbody,
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

          <label className="campo">
            <span>Descanso entre séries (min)</span>
            <input inputMode="decimal" type="number" step="0.25" min="0.25" max="30" value={descanso} onChange={(e) => setDescanso(e.target.value)} placeholder="ex.: 1,5" />
            <small className="texto-secundario">
              Ao registrar uma série, o cronômetro de descanso inicia e o app avisa quando o tempo acabar. Deixe vazio para desligar.
            </small>
          </label>

          <label className="campo-alternar">
            <div>
              <span className="campo-alternar-titulo">Sugestão de treino full body</span>
              <small className="texto-secundario">
                Mostra na tela de Treino um treino full body sugerido, com carga calculada pelo seu histórico.
              </small>
            </div>
            <input
              type="checkbox"
              role="switch"
              className="alternar"
              checked={fullbody}
              onChange={(e) => setFullbody(e.target.checked)}
            />
          </label>

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
