document.addEventListener("DOMContentLoaded", function () {
  cargarBitacora();

  function cargarBitacora() {
    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/admin/mostrarBitacora", {
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
        mostrarBitacora(data);
      })
      .catch((error) => {
        console.error("Error al cargar la bitácora:", error);
      });
  }

  function mostrarBitacora(data) {
    const tableBody = document.querySelector("#table tbody");
    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='5'>No hay datos</td></tr>";
      return;
    }

    data.forEach((registro) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td><input type="checkbox" data-id="${registro.id}" /></td>
                <td>${registro.id}</td>
                <td>${new Date(registro.fecha).toLocaleString()}</td>
                <td>${registro.usuario}</td>
                <td>${registro.accion}</td>
            `;
      tableBody.appendChild(row);
    });
  }

  // Lógica de paginación similar a la de usuarios
  const bitacoraPorPagina = 10;
  let paginaActual = 1;

  document.getElementById("nextPage").addEventListener("click", function () {
    if (paginaActual * bitacoraPorPagina < totalRegistros.length) {
      paginaActual++;
      cargarBitacora(); // Cargar de nuevo los datos para la página siguiente
    }
  });

  document.getElementById("prevPage").addEventListener("click", function () {
    if (paginaActual > 1) {
      paginaActual--;
      cargarBitacora(); // Cargar de nuevo los datos para la página anterior
    }
  });
});

// Función para registrar acciones en la bitácora
export function registroBitacora(usuario, accion) {
  const token = localStorage.getItem("token");
  fetch("http://localhost:3000/admin/registrarBitacora", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ usuario, accion }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error en la respuesta HTTP: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Registro de bitácora exitoso:", data);
    })
    .catch((error) => {
      console.error("Error al registrar en la bitácora:", error);
    });
}
