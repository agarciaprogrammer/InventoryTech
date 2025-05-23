import { registroBitacora } from "./bitacora.js";

document.addEventListener("DOMContentLoaded", function () {
  cargarBackups();

  document.querySelector(".backup").addEventListener("click", crearBackup);
  document
    .querySelector(".restaurar")
    .addEventListener("click", restaurarBackup);
});

function cargarBackups() {
  const token = localStorage.getItem("token");
  fetch("http://localhost:3000/admin/listaBackups", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => mostrarBackups(data))
    .catch((error) => console.error("Error al cargar los backups:", error));
}

function mostrarBackups(backups) {
  const tableBody = document.querySelector("#table tbody");
  tableBody.innerHTML = "";

  if (!Array.isArray(backups) || backups.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='3'>No hay backups disponibles</td></tr>";
    return;
  }

  backups.forEach((backup) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="radio" name="backup" value="${backup.ID}" /></td>
      <td>${new Date(backup.Fecha).toLocaleString()}</td>
      <td>${backup.Nombre}</td>
    `;
    tableBody.appendChild(row);
  });
}

function crearBackup() {
  const token = localStorage.getItem("token");
  fetch("http://localhost:3000/admin/crearBackup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then(registroBitacora("user", `Backup creado`))
    .then(cargarBackups())
    .then(alert("El backup fue creado de forma satisfactoria."))
    .catch((error) => console.error("Error al crear backup:", error));
}

function restaurarBackup() {
  const seleccionado = document.querySelector('input[name="backup"]:checked');
  if (!seleccionado) {
    alert("Por favor selecciona un backup para restaurar.");
    return;
  }
  const nombreBackup = seleccionado
    .closest("tr")
    .querySelector("td:last-child").textContent;

  const token = localStorage.getItem("token");
  fetch("http://localhost:3000/admin/restaurarBackup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nombreArchivo: nombreBackup }),
  })
    .then((response) => response.json())
    .then((data) => alert(data.message))
    .catch((error) => console.error("Error al restaurar backup:", error));
}
