import { verificarAutenticacion } from "./autenticacion.js";

document.addEventListener("DOMContentLoaded", async function () {
  const isAuthenticated = await verificarAutenticacion();

  if (!isAuthenticated) {
    return;
  }

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
    tableBody.innerHTML = "<tr><td colspan='9'>No hay datos</td></tr>";
    return;
  }

  productosPagina.forEach((producto) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td><input type="checkbox" data-codbarra="${producto.CodBarra}" /></td>
            <td>${producto.CodBarra}</td>
            <td>${producto.Producto}</td>
            <td>${producto.Marca}</td>
            <td>${producto.Categoria}</td>
            <td>${producto.PrecioUnitario}</td>
            <td>${producto.Stock}</td>
            <td>${producto.Vencimiento}</td>
            <td>${producto.IDProveedor}</td>
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

// BORRAR PRODUCTO
document
  .getElementById("borrarProductoBtn")
  .addEventListener("click", async function () {
    const checkboxes = document.querySelectorAll(
      "input[type='checkbox']:checked"
    );
    if (checkboxes.length === 0) {
      alert("Por favor, selecciona al menos un producto para eliminar.");
      return;
    }

    const codigosBarras = Array.from(checkboxes).map(
      (checkbox) => checkbox.dataset.codbarra
    );
    const token1 = localStorage.getItem("token");
    try {
      const response = await fetch(
        "http://localhost:3000/productos/eliminarProducto",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token1}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ codigosBarras }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el producto");
      }

      alert("Producto(s) eliminado(s) con éxito");
      window.location.reload();
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
    }
  });

// MODIFICAR PRODUCTO
document
  .getElementById("modificarProductoBtn")
  .addEventListener("click", function (event) {
    event.preventDefault();

    const checkboxes = document.querySelectorAll(
      "input[type='checkbox']:checked"
    );

    if (checkboxes.length !== 1) {
      alert("Por favor, selecciona un solo producto para modificar.");
      return;
    }

    const CodBarra = checkboxes[0].dataset.codbarra;

    if (!CodBarra) {
      alert(
        "(stock.js) No se pudo encontrar el código de barras del producto."
      );
      return;
    }
    window.location.href = `modificarproducto.html?CodBarra=${CodBarra}`;
  });
