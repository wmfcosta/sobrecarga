export default function VisualizadorGif({ gif, aoFechar }) {
  if (!gif) return null

  return (
    <div className="overlay-gif" onClick={aoFechar}>
      <div className="conteudo-overlay-gif" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="botao-fechar-overlay" onClick={aoFechar} aria-label="Fechar">×</button>
        <img src={gif.url} alt="" />
        {gif.nome && <p className="texto-secundario">{gif.nome}</p>}
      </div>
    </div>
  )
}
