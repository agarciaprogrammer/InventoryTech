import { registroBitacora } from "./bitacora.js";

document.addEventListener("DOMContentLoaded", function () {
  cargarUsuarios();

  document
    .querySelector(".search-container input")
    .addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      usuariosFiltrados = totalUsuarios.filter((usuario) =>
        usuario.usuario.toLowerCase().includes(searchTerm)
      );
      paginaActual = 1;
      mostrarUsuarios(paginaActual);
    });
});

let totalUsuarios = [];
let usuariosFiltrados = [];
const usuariosPorPagina = 10;
let paginaActual = 1;

function cargarUsuarios() {
  const token = localStorage.getItem("token");
  fetch("http://localhost:3000/admin/usuarios", {
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
      totalUsuarios = data;
      usuariosFiltrados = totalUsuarios;
      mostrarUsuarios(paginaActual);
    })
    .catch((error) => {
      console.error("Error al cargar los usuarios:", error);
    });
}

function mostrarUsuarios(pagina) {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";

  const inicio = (pagina - 1) * usuariosPorPagina;
  const fin = inicio + usuariosPorPagina;
  const usuariosPagina = usuariosFiltrados.slice(inicio, fin);

  if (usuariosPagina.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='6'>No hay datos</td></tr>";
    return;
  }

  usuariosPagina.forEach((usuario) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td><input type="checkbox" data-id="${usuario.ID}" /></td>  
            <td>${usuario.ID}</td>
            <td>${usuario.usuario}</td>
            <td>${usuario.email}</td>
            <td>
                <input type="checkbox" ${
                  usuario.suscripto ? "checked" : ""
                } disabled />
            </td>
            <td>${usuario.fecha_finalizacion}</td>
            <td>
                <input type="checkbox" ${
                  usuario.suspendido ? "checked" : ""
                } disabled />
            </td>
            <td>${usuario.fecha_fin_suspension || ""}</td>
            <td>
                <input type="checkbox" ${
                  usuario.admin ? "checked" : ""
                } disabled />
            </td>
        `;
    tableBody.appendChild(row);
  });

  document.getElementById("prevPage").disabled = paginaActual === 1;
  document.getElementById("nextPage").disabled =
    fin >= usuariosFiltrados.length;
}

document.getElementById("nextPage").addEventListener("click", function () {
  if (paginaActual * usuariosPorPagina < usuariosFiltrados.length) {
    paginaActual++;
    mostrarUsuarios(paginaActual);
  }
});
document.getElementById("prevPage").addEventListener("click", function () {
  if (paginaActual > 1) {
    paginaActual--;
    mostrarUsuarios(paginaActual);
  }
});

function obtenerIdsSeleccionados() {
  const checkboxes = document.querySelectorAll(
    'table tbody input[type="checkbox"]:checked[data-id]'
  );
  return Array.from(checkboxes).map((checkbox) => checkbox.dataset.id);
}

document.querySelector(".suspender").addEventListener("click", () => {
  const ids = obtenerIdsSeleccionados();
  const token = localStorage.getItem("token");
  ids.forEach((id) => {
    fetch(`http://localhost:3000/admin/suspender/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        cargarUsuarios();
        registroBitacora("user", `Suspender usuario ID: ${id}`);
      })
      .catch((error) => console.error("Error al suspender usuario:", error));
  });
});

document.querySelector(".eliminar").addEventListener("click", () => {
  const ids = obtenerIdsSeleccionados();
  const token = localStorage.getItem("token");
  ids.forEach((id) => {
    fetch(`http://localhost:3000/admin/eliminar/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        cargarUsuarios();
        registroBitacora("user", `Eliminar usuario ID: ${id}`);
      })
      .catch((error) => console.error("Error al eliminar usuario:", error));
  });
});

document.querySelector(".suscripcion").addEventListener("click", () => {
  const ids = obtenerIdsSeleccionados();
  const token = localStorage.getItem("token");
  ids.forEach((id) => {
    fetch(`http://localhost:3000/admin/suscripcion/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        cargarUsuarios();
        registroBitacora("user", `Activar suscripción usuario ID: ${id}`);
      })
      .catch((error) => console.error("Error al activar suscripción:", error));
  });
});
