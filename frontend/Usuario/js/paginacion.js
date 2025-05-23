function paginarDatos(
  datos,
  elementosPorPagina,
  pagina,
  tableBodySelector,
  renderRow
) {
  const tableBody = document.querySelector(tableBodySelector);
  tableBody.innerHTML = "";

  const inicio = (pagina - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const datosPagina = datos.slice(inicio, fin);

  if (datosPagina.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4'>No hay datos</td></tr>";
    return;
  }

  datosPagina.forEach((dato) => {
    const row = document.createElement("tr");
    row.innerHTML = renderRow(dato);

    tableBody.appendChild(row);
  });

  document.getElementById("prevPage").disabled = pagina === 1;
  document.getElementById("nextPage").disabled = fin >= datos.length;
}
