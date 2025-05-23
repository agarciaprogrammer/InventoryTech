const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();
const PDFDocument = require("pdfkit");
const fs = require("fs");
const authMiddleware = require("../../middle/userToken");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const usuarioID = req.user.id;
    await sql.connect();
    const result = await sql.query(
      `SELECT * FROM OrdenCompra WHERE usuarioID = ${usuarioID}`
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error de conexión con SQL Server: ", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.post("/verificarStock", authMiddleware, async (req, res) => {
  try {
    const usuarioID = req.user.id;
    await sql.connect();
    const productos =
      await sql.query`SELECT * FROM Productos WHERE Stock < LimiteStock AND activo = 1 AND usuarioID = ${usuarioID} `;

    for (const producto of productos.recordset) {
      const cantidadNecesaria = producto.LimiteStock - producto.Stock + 1;

      const checkExistencia =
        await sql.query`SELECT COUNT(*) as count FROM OrdenCompra WHERE CodBarra = ${producto.CodBarra}`;
      const existe = checkExistencia.recordset[0].count > 0;

      if (existe) {
        await sql.query`UPDATE OrdenCompra SET Cantidad = ${cantidadNecesaria} WHERE CodBarra = ${producto.CodBarra}`;
      } else {
        await sql.query`INSERT INTO OrdenCompra (CodBarra, Producto, Categoria, Cantidad, PrecioUnitario, IDProveedor, usuarioID) 
                        VALUES (${producto.CodBarra}, ${producto.Producto}, ${
          producto.Categoria
        }, ${cantidadNecesaria}, ${producto.PrecioUnitario * 0.75}, ${
          producto.IDProveedor
        }, ${producto.usuarioID})`;
      }
    }

    res.status(200).json({
      message: "Productos agregados a la orden de compra o actualizados",
    });
  } catch (error) {
    console.error(
      "Error al verificar y mover productos:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Error al verificar productos" });
  }
});

router.post("/confirmarOrdenCompra", authMiddleware, async (req, res) => {
  try {
    await sql.connect();
    const usuarioID = req.user.id;
    const productosModificados = req.body.productos;

    let totalCompra = 0;
    const fechaConfirmacion = new Date();
    fechaConfirmacion.setMonth(fechaConfirmacion.getMonth() + 1);
    const fechaVencimiento = fechaConfirmacion.toISOString().split("T")[0];

    for (const producto of productosModificados) {
      await sql.query`
        UPDATE Productos 
        SET 
          Stock = Stock + ${producto.Cantidad},
          Vencimiento = ${fechaVencimiento} 
        WHERE CodBarra = ${producto.CodBarra}`;

      totalCompra += producto.Cantidad * producto.PrecioUnitario;
    }

    // PDF
    const doc = new PDFDocument();
    const idCompra = `OC${Date.now()}`;
    const pdfPath = `orden_compra_${idCompra}.pdf`;

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(20).text(`ORDEN DE COMPRA ${idCompra}`, {
      align: "center",
    });
    doc.moveDown();

    doc.fontSize(14).text("Productos a comprar:");
    productosModificados.forEach((producto) => {
      doc
        .moveDown()
        .text(
          `Producto: ${producto.Producto}\nCódigo de Barras: ${producto.CodBarra}\nCategoría: ${producto.Categoria}\nCantidad: ${producto.Cantidad}\nPrecio Unitario: ${producto.PrecioUnitario}\nProveedor: ${producto.IDProveedor}\n\n`
        );
    });

    doc.moveDown();
    doc
      .fontSize(16)
      .text(`Total: $${totalCompra.toFixed(2)}`, { align: "right" });

    doc.end();

    const fechaActual = new Date();
    await sql.query`INSERT INTO Compras (idCompra, Fecha, Total, usuarioID) VALUES (${idCompra}, ${fechaActual}, ${totalCompra}, ${usuarioID})`;

    await sql.query("DELETE FROM OrdenCompra");

    res.status(200).json({
      message: "Orden de compra confirmada, stock actualizado y PDF generado",
      pdfPath: pdfPath,
    });
  } catch (error) {
    console.error("Error al confirmar la orden de compra:", error);
    res.status(500).json({ message: "Error al confirmar la orden de compra" });
  }
});

router.post("/cancelarOrdenCompra", authMiddleware, async (req, res) => {
  try {
    await sql.connect();
    const usuarioID = req.user.id;
    await sql.query(`DELETE FROM OrdenCompra WHERE usuarioID = ${usuarioID}`);
    res.status(200).json({ message: "Orden de compra cancelada" });
  } catch (error) {
    console.error("Error al cancelar la orden de compra:", error);
    res.status(500).json({ message: "Error al cancelar la orden de compra" });
  }
});

module.exports = router;
