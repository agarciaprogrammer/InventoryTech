const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();
const authMiddleware = require("../../middle/userToken");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const usuarioID = req.user.id;
    await sql.connect(config);
    const today = new Date().toISOString().split("T")[0];

    await sql.query(`
      UPDATE Productos
      SET Stock = 0
      WHERE activo = 1 AND Vencimiento < '${today}' AND usuarioID = ${usuarioID}
    `);

    const result = await sql.query(`
      SELECT *
      FROM Productos
      WHERE activo = 1 AND usuarioID = ${usuarioID}
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error de conexión con SQL Server: ", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.post("/agregarProducto", authMiddleware, async (req, res) => {
  const {
    CodBarra,
    Producto,
    Marca,
    Categoria,
    PrecioUnitario,
    Stock,
    Vencimiento,
    IDProveedor,
    LimiteStock,
    CategoriaID,
  } = req.body;

  console.log("CategoriaID recibido:", CategoriaID);

  const precMod = 0;
  const stockMod = 0;
  const activo = 1;

  try {
    const usuarioID = req.user.id;

    await sql.connect(config);

    await sql.query`INSERT INTO Productos 
      (CodBarra, Producto, Marca, Categoria, PrecioUnitario, Stock, Vencimiento, IDProveedor, LimiteStock, CategoriaID, PrecioModificado, StockModificado, activo, usuarioID) 
      VALUES (${CodBarra}, ${Producto}, ${Marca}, ${Categoria}, ${PrecioUnitario}, ${Stock}, ${Vencimiento}, ${IDProveedor}, ${LimiteStock}, ${CategoriaID}, ${precMod}, ${stockMod}, ${activo}, ${usuarioID})`;

    res.status(201).json({ message: "Producto agregado con éxito" });
  } catch (error) {
    console.error("Error al agregar producto:", error);
    res.status(500).json({ message: "Error al agregar producto" });
  }
});

router.delete("/eliminarProducto", async (req, res) => {
  const { codigosBarras } = req.body;

  try {
    await sql.connect(config);
    for (const codigo of codigosBarras) {
      await sql.query`UPDATE Productos SET activo = 0 WHERE CodBarra = ${codigo}`;
    }
    res.status(200).json({ message: "Producto(s) eliminado(s) con éxito" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
});

router.get("/producto/:CodBarra", authMiddleware, async (req, res) => {
  const { CodBarra } = req.params;
  const usuarioID = req.user.id;

  try {
    await sql.connect(config);
    const result =
      await sql.query`SELECT * FROM Productos WHERE CodBarra = ${CodBarra} AND activo = 1 AND usuarioID = ${usuarioID}`;
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener los datos del producto:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.put("/modificarProducto", async (req, res) => {
  const {
    CodBarra,
    Producto,
    Marca,
    Categoria,
    PrecioUnitario,
    Stock,
    Vencimiento,
    IDProveedor,
    CategoriaID,
  } = req.body;

  try {
    await sql.connect(config);

    const query = `
      UPDATE Productos 
      SET Producto = @Producto, 
          Marca = @Marca, 
          Categoria = @Categoria, 
          PrecioUnitario = @PrecioUnitario, 
          Stock = @Stock, 
          Vencimiento = @Vencimiento, 
          IDProveedor = @IDProveedor,
          CategoriaID = @CategoriaID
      WHERE CodBarra = @CodBarra`;

    const request = new sql.Request();
    const result = await request
      .input("Producto", sql.VarChar, Producto)
      .input("Marca", sql.VarChar, Marca)
      .input("Categoria", sql.VarChar, Categoria)
      .input("PrecioUnitario", sql.Int, PrecioUnitario)
      .input("Stock", sql.Int, Stock)
      .input("Vencimiento", sql.VarChar, Vencimiento)
      .input("IDProveedor", sql.VarChar, IDProveedor)
      .input("CategoriaID", sql.Int, CategoriaID)
      .input("CodBarra", sql.VarChar, CodBarra)
      .query(query);

    res.status(200).json({ message: "Producto modificado con éxito" });
  } catch (error) {
    console.error("Error al modificar el producto:", error);
    res.status(500).json({ message: "Error al modificar el producto" });
  }
});

router.put("/actualizarLimiteStock/:CodBarra", async (req, res) => {
  const { CodBarra } = req.params;
  const { LimiteStock } = req.body;

  try {
    await sql.connect(config);
    const result =
      await sql.query`UPDATE Productos SET LimiteStock = ${LimiteStock} WHERE CodBarra = ${CodBarra}`;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json({ message: "Límite de stock actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar el límite de stock:", error);
    res.status(500).json({ message: "Error al actualizar el límite de stock" });
  }
});

module.exports = router;
