document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");

  fetch("http://localhost:3000/inflacion", {
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
      totalInflacion = data;
      inflacionFiltrados = totalInflacion;
      mostrarInflacion();
    })
    .catch((error) => {
      console.error("Error al cargar la inflacion:", error);
    });
});

function mostrarInflacion() {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";

  const tablaInflacion = inflacionFiltrados;

  tablaInflacion.forEach((inflacion) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${inflacion.ID}</td>
        <td>${inflacion.Fecha}</td>
        <td>${inflacion.CategoriasAfectadas}</td>
        <td>${inflacion.ValorInflacion}%</td>
        `;
    tableBody.appendChild(row);
  });
}

// INFLACION SEMANAL
document.querySelector(".inflacionbtn").addEventListener("click", function () {
  const categoriaSeleccionada = document.querySelector("#categoria").value;
  const inflacionInput = document.querySelector("#inflacionInput").value;
  const inflacionValor = parseFloat(inflacionInput);

  const data = {
    categoria: categoriaSeleccionada,
    inflacion: inflacionValor,
  };

  const token = localStorage.getItem("token");

  fetch("http://localhost:3000/inflacion/aplicarInflacion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        alert(data.message);
        location.reload();
      }
    })
    .catch((error) => {
      console.error("Error al aplicar la inflación:", error);
    });
});
