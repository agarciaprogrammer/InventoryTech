const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();
const authMiddleware = require("../../middle/userToken");

router.get("/", authMiddleware, async (req, res) => {
  try {
    await sql.connect(config);
    const usuarioID = req.user.id;
    const result = await sql.query(
      `SELECT * FROM Inflacion WHERE usuarioID = ${usuarioID}`
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error de conexión con SQL Server: ", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.post("/aplicarInflacion", authMiddleware, async (req, res) => {
  const { categoria, inflacion } = req.body;
  const fecha = new Date().toISOString().slice(0, 10);
  let categoriaNombre = "Todos";
  const usuarioID = req.user.id;
  try {
    await sql.connect(config);

    if (categoria === "0") {
      await sql.query`UPDATE Productos SET PrecioUnitario = PrecioUnitario * (1 + CAST(${inflacion} AS FLOAT) / 100) WHERE usuarioID = ${usuarioID}`;
    } else {
      const categoriaResult =
        await sql.query`SELECT Categoria FROM Productos WHERE CategoriaID = ${categoria}`;
      categoriaNombre = categoriaResult.recordset[0].Categoria;

      await sql.query`UPDATE Productos SET PrecioUnitario = PrecioUnitario * (1 + CAST(${inflacion} AS FLOAT) / 100) WHERE CategoriaID = ${categoria} AND usuarioID = ${usuarioID}`;
    }

    await sql.query`INSERT INTO Inflacion (Fecha, CategoriasAfectadas, ValorInflacion, usuarioID) VALUES (${fecha}, ${categoriaNombre}, ${inflacion}, ${usuarioID})`;

    res
      .status(200)
      .json({ message: "Ajuste de inflación aplicado con éxito." });
  } catch (err) {
    console.error("Error al aplicar el ajuste de inflación:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
