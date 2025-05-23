const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();
const authMiddleware = require("../../middle/userToken");

router.get("/", authMiddleware, async (req, res) => {
  try {
    await sql.connect(config);
    const usuarioID = req.user.id;
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const vencenHoy = await sql.query`
        SELECT * FROM Productos WHERE Vencimiento = ${today} AND activo = 1 AND usuarioID = ${usuarioID}
      `;
    const vencenManana = await sql.query`
        SELECT * FROM Productos WHERE Vencimiento = ${tomorrow} AND activo = 1 AND usuarioID = ${usuarioID}
      `;

    const perdidasHoy = vencenHoy.recordset.reduce((total, producto) => {
      return total + producto.PrecioUnitario * producto.Stock;
    }, 0);
    const perdidasManana = vencenManana.recordset.reduce((total, producto) => {
      return total + producto.PrecioUnitario * producto.Stock;
    }, 0);

    res.json({
      productos: [...vencenHoy.recordset, ...vencenManana.recordset],
      perdidasHoy,
      perdidasManana,
      today,
      tomorrow,
    });
  } catch (err) {
    console.error("Error de conexión con SQL Server: ", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
