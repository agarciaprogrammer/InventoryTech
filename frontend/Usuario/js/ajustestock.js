document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("http://localhost:3000/productos", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta HTTP: " + response.status);
    }

    const data = await response.json();
    totalProductos = data;
    productosFiltrados = totalProductos;
    mostrarProductos(paginaActual);
  } catch (error) {
    console.error("Error al cargar los productos:", error);
  }

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
    tableBody.innerHTML = "<tr><td colspan='6'>No hay datos</td></tr>";
    return;
  }

  const token = localStorage.getItem("token");

  fetch("http://localhost:3000/demanda/calcularStockSugerido", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Error al cargar el stock sugerido: " + response.status
        );
      }
      return response.json();
    })
    .then((productosConStockSugerido) => {
      productosPagina.forEach((producto) => {
        const stockSugeridoObj = productosConStockSugerido.find(
          (p) => p.CodBarra === producto.CodBarra
        );

        const stockSugerido = stockSugeridoObj
          ? stockSugeridoObj.StockSugerido
          : producto.Stock;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="checkbox" data-codbarra="${producto.CodBarra}" /></td>
            <td>${producto.CodBarra}</td>
            <td>${producto.Producto}</td>
            <td>${producto.Categoria}</td>
            <td>${producto.Stock}</td>
            <td contenteditable="true">${stockSugerido}</td> 
          `;

        if (Number(producto.StockModificado) === 1) {
          row.style.backgroundColor = "green";
          row.style.color = "white";
          row.style.fontWeight = "bold";
        }

        tableBody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error al cargar el stock sugerido:", error);
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

document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector(".ajusteStockBtn")
    .addEventListener("click", function () {
      const confirmacion = confirm(
        "¿Estás seguro de aplicar los ajustes de stock?"
      );

      if (confirmacion) {
        const productosSeleccionados = [];
        const checkboxes = document.querySelectorAll(
          "table tbody tr input[type='checkbox']:checked"
        );

        if (checkboxes.length > 0) {
          checkboxes.forEach((checkbox) => {
            const row = checkbox.closest("tr");
            const codBarra = checkbox.getAttribute("data-codbarra");
            const stockSugerido = parseInt(row.cells[5].textContent, 10);

            productosSeleccionados.push({
              CodBarra: codBarra,
              StockSugerido: stockSugerido,
            });
          });
        } else {
          document.querySelectorAll("table tbody tr").forEach((row) => {
            const codBarra = row
              .querySelector("input[type='checkbox']")
              .getAttribute("data-codbarra");
            const stockSugerido = parseInt(row.cells[4].textContent, 10);

            productosSeleccionados.push({
              CodBarra: codBarra,
              StockSugerido: stockSugerido,
            });
          });
        }
        const token = localStorage.getItem("token");
        if (productosSeleccionados.length > 0) {
          fetch("http://localhost:3000/demanda/aplicarStockSugerido", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productos: productosSeleccionados }),
          })
            .then((response) => {
              if (response.ok) {
                alert("Ajustes de stock aplicados correctamente.");
              } else {
                alert("Hubo un problema al aplicar los ajustes de stock.");
              }
            })
            .catch((error) => {
              console.error("Error al aplicar ajustes de stock:", error);
              alert("Error al aplicar ajustes de stock.");
            });
        }
      }
    });
});
