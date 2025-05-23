document.querySelector(".export-btn").addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  const fechaInicio =
    document.querySelector("#fechaDesde").value || "2001-01-01";
  const fechaFin =
    document.querySelector("#fechaHasta").value ||
    new Date().toISOString().split("T")[0];

  console.log(fechaInicio, fechaFin);

  try {
    const response = await fetch(
      `http://localhost:3000/balance/obtenerBalance?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener el balance");
    }

    const { ganancias, gastos, resultado } = await response.json();

    const formatNumber = (num) => {
      return num.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    document.querySelector(".balance-ganancia").textContent = `$${formatNumber(
      ganancias
    )}`;
    document.querySelector(".balance-gastos").textContent = `-$${formatNumber(
      gastos
    )}`;
    document.querySelector(".balance-resultado").textContent = `$${formatNumber(
      resultado
    )}`;

    document.querySelector(".balance-ganancia").classList.add("color-ganancia");
    document.querySelector(".balance-gastos").classList.add("color-gastos");
    document
      .querySelector(".balance-resultado")
      .classList.add("color-resultado");
  } catch (error) {
    console.error("Error:", error);
  }
});
