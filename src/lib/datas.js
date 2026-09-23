// Datas no fuso do aparelho (ex.: Brasília), no formato AAAA-MM-DD.
// toISOString() usa UTC e, depois das 21h no Brasil, já devolve o dia seguinte.
export function dataLocalISO(d = new Date()) {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
