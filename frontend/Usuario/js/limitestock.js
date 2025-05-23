document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");

  fetch("http://localhost:3000/productos", {
    method: "GET",
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
      totalProductos = data;
      productosFiltrados = totalProductos;
      mostrarProductos(paginaActual);
    })
    .catch((error) => {
      console.error("Error al cargar los productos:", error);
    });

  document
    .querySelector(".search-container input")
    .addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      productosFiltrados = totalProductos.filter((producto) =>
        producto.Producto.toLowerCase().includes(searchTerm)
      );
      paginaActual = 1;
      mostrarProductos(paginaActual);
    });

  // límite de stock
  document.querySelector(".export-btn").addEventListener("click", function () {
    const nuevoLimite = document.querySelector(
      ".limitestock-input input"
    ).value;
    const productoSeleccionado = document.querySelector(
      'input[type="checkbox"]:checked'
    );

    if (productoSeleccionado && nuevoLimite) {
      const codBarra = productoSeleccionado.getAttribute("data-codbarra");

      fetch(
        `http://localhost:3000/productos/actualizarLimiteStock/${codBarra}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ LimiteStock: nuevoLimite }),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error al actualizar el límite de stock");
          }
          return response.json();
        })
        .then((data) => {
          const productoActualizado = totalProductos.find(
            (p) => p.CodBarra === codBarra
          );
          if (productoActualizado) {
            productoActualizado.LimiteStock = nuevoLimite;
            mostrarProductos(paginaActual);
          }
          alert("Límite de stock actualizado correctamente.");
        })
        .catch((error) => {
          console.error("Error al actualizar el límite de stock:", error);
        });
    } else {
      alert(
        "Por favor, selecciona un producto y especifica un nuevo límite de stock."
      );
    }
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
          <td>${producto.Categoria}</td>
          <td>${producto.Stock}</td>
          <td>${producto.LimiteStock}</td>
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
