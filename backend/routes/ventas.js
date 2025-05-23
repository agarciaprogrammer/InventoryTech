const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();
const authMiddleware = require("../../middle/userToken");

// OBTENER VENTAS
router.get("/getVentas", authMiddleware, async (req, res) => {
  try {
    const usuarioID = req.user.id;
    const pool = await sql.connect(config);

    const ventasQuery = `
      SELECT V.IDVenta, V.Fecha, SUM(D.Cantidad * P.PrecioUnitario) AS TotalVenta
      FROM Ventas V
      JOIN DetallesVenta D ON V.IDVenta = D.IDVenta
      JOIN Productos P ON D.ProductoID = P.CodBarra
      WHERE V.usuarioID = @usuarioID
      GROUP BY V.IDVenta, V.Fecha
      ORDER BY V.Fecha DESC;
    `;

    const result = await pool
      .request()
      .input("usuarioID", sql.Int, usuarioID)
      .query(ventasQuery);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error obteniendo ventas:", err);
    res.status(500).send("Error obteniendo ventas");
  }
});

// OBTENER DETALLES DE UNA VENTA
router.get("/getVentaDetalles/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const usuarioID = req.user.id;
    const pool = await sql.connect(config);

    const detallesQuery = `
      SELECT P.Producto, D.Cantidad, P.PrecioUnitario, (D.Cantidad * P.PrecioUnitario) AS Subtotal
      FROM DetallesVenta D
      JOIN Productos P ON D.ProductoID = P.CodBarra
      JOIN Ventas V ON D.IDVenta = V.IDVenta
      WHERE D.IDVenta = @idVenta AND V.usuarioID = @usuarioID;
    `;

    const result = await pool
      .request()
      .input("idVenta", sql.VarChar, id)
      .input("usuarioID", sql.Int, usuarioID)
      .query(detallesQuery);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error obteniendo detalles de la venta:", err);
    res.status(500).send("Error obteniendo detalles de la venta");
  }
});

// BUSCAR PRODUCTOS
router.get("/buscarProductos", authMiddleware, async (req, res) => {
  const { query } = req.query;
  try {
    const usuarioID = req.user.id;
    const pool = await sql.connect(config);

    const result = await pool
      .request()
      .input("query", sql.NVarChar, `%${query}%`)
      .input("usuarioID", sql.Int, usuarioID).query(`
        SELECT CodBarra, Producto, Marca, Stock, PrecioUnitario, Vencimiento 
        FROM Productos 
        WHERE Producto LIKE @query AND activo = 1 AND usuarioID = @usuarioID;
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ error: "Error en la consulta" });
  }
});

// FINALIZAR VENTA
router.post("/finalizarVenta", authMiddleware, async (req, res) => {
  const { carrito } = req.body;

  if (!Array.isArray(carrito) || carrito.length === 0) {
    return res.status(400).send("El carrito está vacío.");
  }

  try {
    const usuarioID = req.user.id;
    const pool = await sql.connect(config);

    const result = await pool.request().query(
      `
      SELECT TOP 1 IDVenta 
      FROM Ventas 
      ORDER BY IDVenta DESC;
    `
    );

    const lastID = result.recordset[0]?.IDVenta || "V0000";
    const newIDNumber = parseInt(lastID.slice(1)) + 1;
    const newIDVenta = `V${newIDNumber.toString().padStart(4, "0")}`;

    await pool
      .request()
      .input("IDVenta", sql.VarChar, newIDVenta)
      .input("Fecha", sql.DateTime, new Date())
      .input("usuarioID", sql.Int, usuarioID).query(`
        INSERT INTO Ventas (IDVenta, Fecha, usuarioID)
        VALUES (@IDVenta, @Fecha, @usuarioID);
      `);

    const insertDetalles = carrito.map(async (producto) => {
      const { CodBarra, cantidad } = producto;

      await pool
        .request()
        .input("IDVenta", sql.VarChar, newIDVenta)
        .input("ProductoID", sql.VarChar, CodBarra)
        .input("Cantidad", sql.Int, cantidad)
        .input("usuarioID", sql.Int, usuarioID).query(`
          INSERT INTO DetallesVenta (IDVenta, ProductoID, Cantidad, usuarioID)
          VALUES (@IDVenta, @ProductoID, @Cantidad, @usuarioID);
        `);

      await pool
        .request()
        .input("CodBarra", sql.VarChar, CodBarra)
        .input("Cantidad", sql.Int, cantidad)
        .input("usuarioID", sql.Int, usuarioID).query(`
          UPDATE Productos
          SET Stock = Stock - @Cantidad
          WHERE CodBarra = @CodBarra AND usuarioID = @usuarioID;
        `);
    });

    await Promise.all(insertDetalles);

    res
      .status(200)
      .json({ message: "Venta finalizada con éxito", IDVenta: newIDVenta });
  } catch (err) {
    console.error("Error finalizando la venta:", err);
    res.status(500).send("Error finalizando la venta");
  }
});

// OBTENER TOP DE PRODUCTOS
router.get("/getTopProductos", authMiddleware, async (req, res) => {
  const { fecha1, fecha2 } = req.query;
  try {
    const usuarioID = req.user.id;
    const pool = await sql.connect(config);

    let query = `
      SELECT TOP 5 P.CodBarra, P.Producto, SUM(D.Cantidad * P.PrecioUnitario) AS GastoTotal
      FROM DetallesVenta D
      JOIN Productos P ON D.ProductoID = P.CodBarra
      JOIN Ventas V ON D.IDVenta = V.IDVenta
      WHERE V.usuarioID = @usuarioID
    `;

    if (fecha1 && fecha2) {
      query += ` AND V.Fecha BETWEEN @fecha1 AND @fecha2 `;
    }

    query += `
      GROUP BY P.CodBarra, P.Producto
      ORDER BY GastoTotal DESC;
    `;

    const request = pool.request().input("usuarioID", sql.Int, usuarioID);
    if (fecha1 && fecha2) {
      request.input("fecha1", sql.Date, fecha1);
      request.input("fecha2", sql.Date, fecha2);
    }

    const result = await request.query(query);
    const productos = result.recordset;

    let totalGastoQuery = `
      SELECT SUM(D.Cantidad * P.PrecioUnitario) AS GastoTotal
      FROM DetallesVenta D
      JOIN Productos P ON D.ProductoID = P.CodBarra
      JOIN Ventas V ON D.IDVenta = V.IDVenta
      WHERE V.usuarioID = @usuarioID 
    `;

    if (fecha1 && fecha2) {
      ` totalGastoQuery +=  WHERE V.Fecha BETWEEN @fecha1 AND @fecha2 `;
    }

    const totalGastoRequest = pool
      .request()
      .input("usuarioID", sql.Int, usuarioID);
    if (fecha1 && fecha2) {
      totalGastoRequest.input("fecha1", sql.Date, fecha1);
      totalGastoRequest.input("fecha2", sql.Date, fecha2);
    }

    const totalGastoResult = await totalGastoRequest.query(totalGastoQuery);
    const totalGasto = totalGastoResult.recordset[0]?.GastoTotal || 0;

    const topProductosConPorcentaje = productos.map((producto) => {
      const porcentaje = totalGasto
        ? (producto.GastoTotal / totalGasto) * 100
        : 0;
      return {
        CodBarra: producto.CodBarra,
        Producto: producto.Producto,
        Porcentaje: porcentaje.toFixed(2),
      };
    });

    res.status(200).json(topProductosConPorcentaje);
  } catch (err) {
    console.error("Error obteniendo el TOP de productos:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
