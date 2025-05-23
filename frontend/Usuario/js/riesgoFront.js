document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  fetch("http://localhost:3000/riesgo", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error en la respuesta HTTP: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      const { productos, perdidasHoy, perdidasManana, today, tomorrow } = data;

      totalProductos = productos;
      productosFiltrados = totalProductos;
      mostrarProductos(paginaActual);

      const hoy = new Date().toISOString().slice(5, 10);
      const manana = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(5, 10);

      document.getElementById("perdidashoy").textContent =
        perdidasHoy.toFixed(2);
      document.getElementById("perdidasmañana").textContent =
        perdidasManana.toFixed(2);
      document.getElementById("hoy").textContent = hoy;
      document.getElementById("mañana").textContent = manana;
    })
    .catch((error) => {
      console.error("Error al cargar los productos:", error);
    });
});

let totalProductos = [];
let productosFiltrados = [];
const productosPorPagina = 10;
let paginaActual = 1;

function mostrarProductos(pagina) {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";

  const inicio = (pagina - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productosFiltrados.slice(inicio, fin);

  if (productosPagina.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='6'>No hay datos</td></tr>";
    return;
  }

  productosPagina.forEach((producto) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><input type="checkbox" data-codbarra="${producto.CodBarra}" /></td>
        <td>${producto.CodBarra}</td>
        <td>${producto.Producto}</td>
        <td>${producto.PrecioUnitario}</td>
        <td>${producto.Stock}</td>
        <td>${producto.Vencimiento}</td>
      `;
    tableBody.appendChild(row);
  });

  document.getElementById("prevPage").disabled = paginaActual === 1;
  document.getElementById("nextPage").disabled =
    fin >= productosFiltrados.length;
}

document.getElementById("nextPage").addEventListener("click", function () {
  if (paginaActual * productosPorPagina < productosFiltrados.length) {
    paginaActual++;
    mostrarProductos(paginaActual);
  }
});
document.getElementById("prevPage").addEventListener("click", function () {
  if (paginaActual > 1) {
    paginaActual--;
    mostrarProductos(paginaActual);
  }
});
