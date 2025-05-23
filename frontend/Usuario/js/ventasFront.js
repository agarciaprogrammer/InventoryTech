let totalVentas = [];
let ventasFiltradas = [];
const ventasPorPagina = 10;
let paginaActual = 1;

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  fetch("http://localhost:3000/ventas/getVentas", {
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
      totalVentas = data;
      ventasFiltradas = totalVentas;
      mostrarVentas(paginaActual);
    })
    .catch((error) => {
      console.error("Error al cargar las ventas:", error);
    });
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (paginaActual * ventasPorPagina < ventasFiltradas.length) {
    paginaActual++;
    mostrarVentas(paginaActual);
  }
});

document.getElementById("prevPage").addEventListener("click", () => {
  if (paginaActual > 1) {
    paginaActual--;
    mostrarVentas(paginaActual);
  }
});

function mostrarVentas(pagina) {
  paginarDatos(
    ventasFiltradas,
    ventasPorPagina,
    pagina,
    "table.ventas tbody",
    (venta) => {
      console.log("Procesando venta:", venta);
      if (!venta.IDVenta) {
        console.error("IDVenta is missing for some entries", venta);
        return "";
      }
      return `
        <tr>
          <td><input type="checkbox" data-id="${venta.IDVenta}" /></td>
          <td>${venta.IDVenta}</td>
          <td>${new Date(venta.Fecha).toLocaleDateString()}</td>
          <td>${venta.TotalVenta.toFixed(2)}</td>
        </tr>
      `;
    }
  );

  document
    .querySelectorAll("table tbody input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.removeEventListener("change", handleCheckboxChange);
    });

  document
    .querySelectorAll("table tbody input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", handleCheckboxChange);
    });
}

function handleCheckboxChange(event) {
  const checkbox = event.currentTarget;
  const idVenta = checkbox.getAttribute("data-id");
  console.log("ID de la venta seleccionada:", idVenta);
  if (idVenta) {
    mostrarDetallesVenta(idVenta);
  } else {
    console.error("No ID found for checkbox", checkbox);
  }

  document
    .querySelectorAll("table tbody input[type='checkbox']")
    .forEach((cb) => {
      if (cb !== checkbox) {
        cb.checked = false;
      }
    });
}

async function mostrarDetallesVenta(idVenta) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://localhost:3000/ventas/getVentaDetalles/${idVenta}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error en la respuesta HTTP: " + response.status);
    }

    const detalles = await response.json();
    const detallesSection = document.querySelector(".detalles");

    detallesSection.innerHTML = "";

    const headers = ["Producto", "Cantidad", "Precio Unitario", "Subtotal"];
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      detallesSection.appendChild(th);
    });

    detalles.forEach((detalle) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${detalle.Producto}</td>
          <td>${detalle.Cantidad}</td>
          <td>${detalle.PrecioUnitario.toFixed(2)}</td>
          <td>${detalle.Subtotal.toFixed(2)}</td>
        `;

      detallesSection.appendChild(row);
    });
  } catch (error) {
    console.error("Error obteniendo detalles de la venta:", error);
  }
}

// TOP PRODUCTOS
document
  .querySelector(".export-btn.btn-top")
  .addEventListener("click", function () {
    const fecha1 = document.getElementById("fecha1").value.trim();
    const fecha2 = document.getElementById("fecha2").value.trim();

    let url = "http://localhost:3000/ventas/getTopProductos";
    if (fecha1 && fecha2) {
      url += `?fecha1=${fecha1}&fecha2=${fecha2}`;
    }

    const token = localStorage.getItem("token");
    fetch(url, {
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
        mostrarTopProductos(data);
      })
      .catch((error) => {
        console.error("Error obteniendo el TOP de productos:", error);
      });
  });

function mostrarTopProductos(productos) {
  const tableBody = document.querySelector("#table-top tbody");
  tableBody.innerHTML = "";

  productos.forEach((producto, index) => {
    const row = `
      <tr>
        <td><input type="checkbox" data-id="${producto.CodBarra}" /></td>
        <td>${producto.CodBarra}</td>
        <td>${producto.Producto}</td>
        <td>${producto.Porcentaje} %</td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}
