const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();
const authMiddleware = require("../../middle/userToken");

const calcularCambioPorcentual = (anterior, actual) => {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return ((actual - anterior) / anterior) * 100;
};

let proyeccionesDemanda = [];

router.get("/proyeccionDemanda", authMiddleware, async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    const pool = await sql.connect(config);
    const usuarioID = req.user.id;

    const ventasCountQuery = `
      SELECT COUNT(*) AS TotalVentas
      FROM Ventas
      WHERE usuarioID = @usuarioID
    `;

    const ventasCountResult = await pool
      .request()
      .input("usuarioID", sql.Int, usuarioID)
      .query(ventasCountQuery);

    const totalVentas = ventasCountResult.recordset[0].TotalVentas;

    if (totalVentas < 100) {
      return res.status(400).json({
        message:
          "Es necesario contar con al menos 100 ventas registradas en el sistema.",
      });
    }

    const query = ` 
      SELECT Categoria, 
             SUM(CASE WHEN V.Fecha BETWEEN @Desde AND @Hasta THEN D.Cantidad ELSE 0 END) AS VentasPeriodoActual,
             SUM(CASE WHEN V.Fecha BETWEEN DATEADD(MONTH, -45, @Desde) AND DATEADD(MONTH, -1, @Hasta) THEN D.Cantidad ELSE 0 END) AS VentasPeriodoAnterior
      FROM DetallesVenta D
      JOIN Productos P ON D.ProductoID = P.CodBarra
      JOIN Ventas V ON D.IDVenta = V.IDVenta
      WHERE D.usuarioID = ${usuarioID}
      GROUP BY Categoria
      ORDER BY VentasPeriodoActual DESC
    `;

    const result = await pool
      .request()
      .input("Desde", sql.Date, desde)
      .input("Hasta", sql.Date, hasta)
      .query(query);

    const categorias = result.recordset;

    const proyeccionDemanda = categorias.map((categoria) => {
      const { Categoria, VentasPeriodoActual, VentasPeriodoAnterior } =
        categoria;
      let cambioPorcentual = calcularCambioPorcentual(
        VentasPeriodoAnterior,
        VentasPeriodoActual
      );

      if (cambioPorcentual > 250.0) {
        cambioPorcentual = 100.0;
      } else if (cambioPorcentual < -250.0) {
        cambioPorcentual = -100.0;
      } else {
        cambioPorcentual = parseFloat(cambioPorcentual.toFixed(2));
      }

      return {
        Categoria,
        CambioPorcentual: cambioPorcentual,
      };
    });

    await pool.request().query(`DELETE FROM ProyeccionesDemanda`);

    for (const proyeccion of proyeccionDemanda) {
      const { Categoria, CambioPorcentual } = proyeccion;
      try {
        await pool
          .request()
          .input("Categoria", sql.NVarChar(255), Categoria)
          .input("CambioPorcentual", sql.Decimal(5, 2), CambioPorcentual)
          .input("FechaUltimaActualizacion", sql.DateTime, new Date())
          .input("usuarioID", sql.Int, usuarioID)
          .query(
            `INSERT INTO ProyeccionesDemanda (Categoria, CambioPorcentual, FechaUltimaActualizacion, usuarioID) 
             VALUES (@Categoria, @CambioPorcentual, @FechaUltimaActualizacion, @usuarioID)`
          );
      } catch (error) {
        console.error(
          `Error al insertar la proyección para la categoría ${Categoria}:`,
          error
        );
      }
    }

    await pool.request().query(`UPDATE Productos SET PrecioModificado = 0`);
    await pool.request().query(`UPDATE Productos SET StockModificado = 0`);

    const aumento = proyeccionDemanda.filter((cat) => cat.CambioPorcentual > 0);
    const disminucion = proyeccionDemanda.filter(
      (cat) => cat.CambioPorcentual < 0
    );

    res.status(200).json({ aumento, disminucion });
  } catch (err) {
    console.error("Error obteniendo la proyección de demanda:", err);
    res.status(500).send("Error obteniendo la proyección de demanda");
  }
});

router.get("/calcularPreciosSugeridos", authMiddleware, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const usuarioID = req.user.id;
    const proyeccionesDemanda = await pool.query(`
      SELECT Categoria, CambioPorcentual FROM ProyeccionesDemanda
    `);

    const preciosSugeridos = await Promise.all(
      proyeccionesDemanda.recordset.map(async (categoria) => {
        const { Categoria, CambioPorcentual } = categoria;
        CambioPorcentual2 = CambioPorcentual / 100;
        let multiplicador = 1 + parseFloat(CambioPorcentual) / 100;
        const productos = await pool
          .request()
          .input("Categoria", sql.VarChar, Categoria)
          .input("UsuarioID", sql.Int, usuarioID).query(`
            SELECT CodBarra, Producto, PrecioUnitario
            FROM Productos
            WHERE Categoria = @Categoria AND PrecioModificado = 0 AND usuarioID = @UsuarioID
          `);

        const productosConPreciosSugeridos = productos.recordset.map(
          (producto) => {
            return {
              CodBarra: producto.CodBarra,
              Producto: producto.Producto,
              PrecioActual: producto.PrecioUnitario,
              PrecioSugerido: (producto.PrecioUnitario * multiplicador).toFixed(
                2
              ),

              Categoria: Categoria,
            };
          }
        );

        return productosConPreciosSugeridos;
      })
    );
    const productosFiltrados = preciosSugeridos.flat();

    res.status(200).json(productosFiltrados);
  } catch (err) {
    console.error("Error calculando precios sugeridos:", err);
    res.status(500).send("Error calculando precios sugeridos");
  }
});

// APLICAR LOS PRECIOS SUGERIDOS
router.post("/aplicarPreciosSugeridos", authMiddleware, async (req, res) => {
  const { productos } = req.body;

  try {
    const pool = await sql.connect(config);

    await pool.request().query(`
      IF EXISTS (
        SELECT 1 
        FROM ProyeccionesDemanda 
        WHERE FechaUltimaActualizacion > (
          SELECT MAX(Fecha) FROM AjustesPrecios
        )
      )
      BEGIN
        UPDATE Productos SET PrecioModificado = 0;
      END
    `);

    let categoriasAfectadas = new Set();
    for (let producto of productos) {
      const { CodBarra, PrecioSugerido, Categoria } = producto;

      await pool
        .request()
        .input("PrecioSugerido", sql.Decimal(18, 2), PrecioSugerido)
        .input("CodBarra", sql.VarChar, CodBarra).query(`
          UPDATE Productos 
          SET PrecioUnitario = @PrecioSugerido, 
              PrecioModificado = 1 
          WHERE CodBarra = @CodBarra
        `);

      categoriasAfectadas.add(Categoria);
    }

    const categoriasAfectadasStr = Array.from(categoriasAfectadas).join(", ");
    await pool
      .request()
      .input("Fecha", sql.DateTime, new Date())
      .input("CategoriasAfectadas", sql.NVarChar(255), categoriasAfectadasStr)
      .input("TipoAjuste", sql.NVarChar(50), "Ajuste de Precios").query(`
    INSERT INTO AjustesPrecios (Fecha, CategoriasAfectadas, TipoAjuste) 
    VALUES (@Fecha, @CategoriasAfectadas, @TipoAjuste)
  `);

    res.status(200).send("Precios sugeridos aplicados correctamente");
  } catch (err) {
    console.error("Error aplicando precios sugeridos:", err);
    res.status(500).send("Error aplicando precios sugeridos");
  }
});

// CALCULAR STOCK SUGERIDO DE LOS PRODUCTOS
router.get("/calcularStockSugerido", authMiddleware, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const usuarioID = req.user.id;
    const proyeccionesDemanda = await pool.query(`
      SELECT Categoria, CambioPorcentual FROM ProyeccionesDemanda
    `);

    const stockSugerido = await Promise.all(
      proyeccionesDemanda.recordset.map(async (categoria) => {
        const { Categoria, CambioPorcentual } = categoria;

        CambioPorcentual2 = CambioPorcentual / 100;

        console.log({ CambioPorcentual2 });
        let multiplicador = 1 + parseFloat(CambioPorcentual) / 100;
        console.log({ multiplicador });

        const productos = await pool
          .request()
          .input("Categoria", sql.VarChar, Categoria).query(`
            SELECT CodBarra, Producto, Stock
            FROM Productos
            WHERE Categoria = @Categoria AND StockModificado = 0 AND usuarioID = ${usuarioID}
          `);

        const productosConStockSugerido = productos.recordset.map(
          (producto) => {
            return {
              CodBarra: producto.CodBarra,
              Producto: producto.Producto,
              StockActual: producto.Stock,
              StockSugerido: Math.ceil(producto.Stock * multiplicador),
              Categoria: Categoria,
            };
          }
        );

        return productosConStockSugerido;
      })
    );

    const productosFiltrados = stockSugerido.flat();
    res.status(200).json(productosFiltrados);
  } catch (err) {
    console.error("Error calculando stock sugerido:", err);
    res.status(500).send("Error calculando stock sugerido");
  }
});

// APLICAR STOCK SUGERIDO
router.post("/aplicarStockSugerido", authMiddleware, async (req, res) => {
  const { productos } = req.body;

  try {
    const pool = await sql.connect(config);

    await pool.request().query(`
      IF EXISTS (
        SELECT 1 
        FROM ProyeccionesDemanda 
        WHERE FechaUltimaActualizacion > (
          SELECT MAX(Fecha) FROM AjustesStock
        )
      )
      BEGIN
        UPDATE Productos SET StockModificado = 0;
      END
    `);

    let categoriasAfectadas = new Set();
    for (let producto of productos) {
      const { CodBarra, StockSugerido, Categoria } = producto;
      console.log(`CodBarra: ${CodBarra}, StockSugerido: ${StockSugerido}`);
      const result = await pool
        .request()
        .input("StockSugerido", sql.Int, StockSugerido)
        .input("CodBarra", sql.VarChar, CodBarra).query(`
            UPDATE Productos 
            SET Stock = @StockSugerido, 
                StockModificado = 1 
            WHERE CodBarra = @CodBarra
        `);
      console.log("Filas afectadas:", result.rowsAffected);

      categoriasAfectadas.add(Categoria);
    }

    const categoriasAfectadasStr = Array.from(categoriasAfectadas).join(", ");
    await pool
      .request()
      .input("Fecha", sql.DateTime, new Date())
      .input("CategoriasAfectadas", sql.NVarChar(255), categoriasAfectadasStr)
      .input("TipoAjuste", sql.NVarChar(50), "Ajuste de Stock").query(`
    INSERT INTO AjustesStock (Fecha, CategoriasAfectadas, TipoAjuste) 
    VALUES (@Fecha, @CategoriasAfectadas, @TipoAjuste)
  `);

    res.status(200).send("Stock sugerido aplicado correctamente");
  } catch (err) {
    console.error("Error aplicando stock sugerido:", err);
    res.status(500).send("Error aplicando stock sugerido");
  }
});

module.exports = router;
