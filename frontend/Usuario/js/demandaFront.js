document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  document
    .getElementById("calculate-btn")
    .addEventListener("click", async () => {
      const fecha1 = document.getElementById("fecha1").value;
      const fecha2 = fechahoy.toISOString().split("T")[0];

      if (!fecha1 || !fecha2) {
        alert("Por favor, selecciona ambas fechas.");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/demanda/proyeccionDemanda?desde=${fecha1}&hasta=${fecha2}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 400) {
          const errorData = await response.json();
          alert(errorData.message);
          return;
        }

        const data = await response.json();

        const aumentoContainer = document.querySelector(
          ".demand-section.aumento"
        );
        const disminucionContainer = document.querySelector(
          ".demand-section.disminucion"
        );

        aumentoContainer.innerHTML = "";
        disminucionContainer.innerHTML = "";

        data.aumento.forEach((categoria) => {
          const item = document.createElement("div");
          item.classList.add("demand-item", "aumento");
          item.innerHTML = `
          <div class="demand-card">
            <span>+${categoria.CambioPorcentual}%</span>
            <span>${categoria.Categoria}</span>
          </div>
        `;
          aumentoContainer.appendChild(item);
        });

        data.disminucion.forEach((categoria) => {
          const item = document.createElement("div");
          item.classList.add("demand-item", "disminucion");
          item.innerHTML = `
          <div class="demand-card">
            <span>${categoria.CambioPorcentual}%</span>
            <span>${categoria.Categoria}</span>
          </div>
        `;
          disminucionContainer.appendChild(item);
        });
      } catch (error) {
        console.error("Error obteniendo la proyección de demanda:", error);
      }
    });
});

let fechahoy = new Date();
document.getElementById("diadehoy").textContent = fechahoy
  .toISOString()
  .split("T")[0];
document.getElementById("fecha2").textContent = fechahoy
  .toISOString()
  .split("T")[0];
