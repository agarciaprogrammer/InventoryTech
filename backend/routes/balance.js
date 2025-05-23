const express = require("express");
const router = express.Router();
const sql = require("mssql");
const authMiddleware = require("../../middle/userToken");

router.get("/obtenerBalance", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  const fechaDesde = fechaInicio || "2001-01-01";
  const fechaHasta = fechaFin || new Date().toISOString().split("T")[0];
  const usuarioID = req.user.id;
  try {
    await sql.connect();

    // Total de Ganancias (Ventas)
    const resultVentas = await sql.query`
      SELECT SUM(D.Cantidad * P.PrecioUnitario) AS TotalVentaTotal
      FROM Ventas V
      JOIN DetallesVenta D ON V.IDVenta = D.IDVenta
      JOIN Productos P ON D.ProductoID = P.CodBarra
      WHERE V.Fecha BETWEEN ${fechaDesde} AND ${fechaHasta} AND V.usuarioID = ${usuarioID}`;

    const totalVentas = resultVentas.recordset[0].TotalVentaTotal || 0;

    // Total de Gastos (Compras)
    const resultCompras = await sql.query`
      SELECT SUM(Total) AS totalCompras
      FROM Compras
      WHERE Fecha BETWEEN ${fechaDesde} AND ${fechaHasta} AND usuarioID = ${usuarioID}; `;

    const totalCompras = resultCompras.recordset[0].totalCompras || 0;

    // Cálculo del Resultado
    const resultado = totalVentas - totalCompras;

    res.status(200).json({
      ganancias: totalVentas,
      gastos: totalCompras,
      resultado: resultado,
    });
  } catch (error) {
    console.error("Error al obtener el balance:", error);
    res.status(500).json({ message: "Error al obtener el balance" });
  }
});

module.exports = router;
