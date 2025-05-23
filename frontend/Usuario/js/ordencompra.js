document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Token no encontrado en almacenamiento local.");
    return;
  }

  // Solicitud para obtener la orden de compra
  fetch("http://localhost:3000/ordencompra", {
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
      calcularTotal();
    })
    .catch((error) => {
      console.error("Error al cargar la orden de compra:", error);
    });

  // Solicitud para verificar el stock
  fetch("http://localhost:3000/ordencompra/verificarStock", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Error en la verificación de stock: " + response.status
        );
      }
      return response.json();
    })
    .then((data) => {
      console.log("Verificación de stock completada:", data);
      if (Array.isArray(data)) {
        totalProductos = data;
        productosFiltrados = totalProductos;
        mostrarProductos(paginaActual);
      } else {
        console.error("Error: los datos devueltos no son un array:", data);
      }
    })
    .catch((error) => {
      console.error("Error al verificar el stock:", error);
    });

  // Confirmar orden de compra
  document
    .querySelector(".confirmar-btn")
    .addEventListener("click", function () {
      const token = localStorage.getItem("token");
      const productosModificados = Array.from(
        document.querySelectorAll("table tbody tr")
      ).map((row) => ({
        CodBarra: row.querySelector("td:nth-child(2)").textContent,
        Producto: row.querySelector("td:nth-child(3)").textContent,
        Categoria: row.querySelector("td:nth-child(4)").textContent,
        Cantidad: parseInt(row.querySelector(".cantidad").textContent, 10),
        PrecioUnitario: parseFloat(
          row.querySelector("td:nth-child(6)").textContent
        ),
        IDProveedor: row.querySelector("td:nth-child(7)").textContent,
      }));

      fetch("http://localhost:3000/ordencompra/confirmarOrdenCompra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productos: productosModificados }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Error en la confirmación de la compra: " + response.status
            );
          }
          return response.json();
        })
        .then((data) => {
          console.log("Compra confirmada:", data);
          alert("Compra confirmada con éxito");
          document.querySelector("table tbody").innerHTML = "";
        })
        .catch((error) => {
          console.error("Error al confirmar la compra:", error);
          alert("Hubo un error al confirmar la compra.");
        });
    });

  // Rechazar orden de compra
  document
    .querySelector(".rechazar-btn")
    .addEventListener("click", function () {
      fetch("http://localhost:3000/ordencompra/cancelarOrdenCompra", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Error en el rechazo de la compra: " + response.status
            );
          }
          return response.json();
        })
        .then((data) => {
          console.log("Compra rechazada:", data);
          alert("Compra rechazada con éxito");
          document.querySelector("table tbody").innerHTML = "";
        })
        .catch((error) => {
          console.error("Error al rechazar la compra:", error);
          alert("Hubo un error al rechazar la compra.");
        });
    });

  // Busqueda en la orden de compra
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

function calcularTotal() {
  const total = productosFiltrados.reduce(
    (acc, producto) => acc + producto.Cantidad * producto.PrecioUnitario,
    0
  );
  document.querySelector(".valortotal").textContent = `$${total.toFixed(2)}`;
}

let totalProductos = [];
let productosFiltrados = [];
const productosPorPagina = 10;
let paginaActual = 1;

function mostrarProductos(pagina) {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";

  const inicio = (pagina - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosAMostrar = productosFiltrados.slice(inicio, fin);

  if (productosAMostrar.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='7'>No hay datos</td></tr>";
    return;
  }

  productosAMostrar.forEach((producto) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td><input type="checkbox" data-codbarra="${producto.CodBarra}" /></td>
          <td>${producto.CodBarra}</td>
          <td>${producto.Producto}</td>
          <td>${producto.Categoria}</td>
          <td contenteditable="true" class="cantidad">${producto.Cantidad}</td>
          <td>${producto.PrecioUnitario}</td>
          <td>${producto.IDProveedor}</td>
        `;
    tableBody.appendChild(row);

    row.querySelector(".cantidad").addEventListener("blur", function () {
      const nuevaCantidad = parseInt(this.textContent, 10);
      if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
        alert("Ingrese una cantidad válida");
        this.textContent = producto.Cantidad;
        return;
      }
      producto.Cantidad = nuevaCantidad;
      calcularTotal();
    });
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
