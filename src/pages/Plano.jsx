import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Plano() {
  const [plano, setPlano] = useState(undefined) // undefined = carregando, null = sem plano

  useEffect(() => {
    api.getMyPlan().then(setPlano).catch(() => setPlano(null))
  }, [])

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <div>
          <h1>Meu plano</h1>
          <p className="texto-secundario">Referência prescrita pelo seu personal</p>
        </div>
      </header>

      {plano === undefined ? (
        <p className="texto-secundario">Carregando...</p>
      ) : plano === null ? (
        <p className="texto-secundario">
          Você ainda não tem um plano prescrito. Continue registrando seus treinos normalmente.
        </p>
      ) : (
        <>
          <div className="cartao">
            <p className="nome-exercicio">{plano.nome}</p>
            {plano.personal_nome && <p className="texto-secundario">Prescrito por {plano.personal_nome}</p>}
          </div>

          {plano.dias.map((dia) => (
            <div key={dia.id} className="cartao bloco-exercicio-treino">
              <p className="nome-exercicio">{dia.rotulo}</p>
              <ul className="lista-series">
                {dia.exercicios.map((ex) => (
                  <li key={ex.id} className="linha-serie">
                    <span className="numero-serie">{ex.exercicio_nome}</span>
                    <span className="valor-carga">{ex.series_alvo ?? '-'}<small>séries</small></span>
                    <span className="valor-reps">{ex.repeticoes_alvo ?? '-'}<small>reps</small></span>
                    {ex.carga_alvo_kg != null && <span className="valor-carga">{ex.carga_alvo_kg}<small>kg</small></span>}
                  </li>
                ))}
              </ul>
              {dia.exercicios.some((ex) => ex.observacoes) && (
                <div>
                  {dia.exercicios.filter((ex) => ex.observacoes).map((ex) => (
                    <p key={ex.id} className="texto-secundario">{ex.exercicio_nome}: {ex.observacoes}</p>
                  ))}
                </div>
              )}
            </div>
          ))}

          <p className="texto-secundario">
            Isto é referência. Para registrar o que você realmente fez, use a tela de Treino.
          </p>
        </>
      )}
    </div>
  )
}
