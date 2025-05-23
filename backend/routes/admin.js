const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();
const path = require("path");
const fs = require("fs");

router.get("/usuarios", async (req, res) => {
  try {
    await sql.connect(config);

    const today = new Date().toISOString().split("T")[0];

    await sql.query(`
      UPDATE Usuarios
      SET 
        fecha_fin_suspension = CASE 
          WHEN fecha_fin_suspension < '${today}' THEN NULL 
          ELSE fecha_fin_suspension 
        END,
        suspendido = CASE 
          WHEN fecha_fin_suspension < '${today}' THEN 0 
          ELSE suspendido 
        END,
        fecha_finalizacion = CASE 
          WHEN fecha_finalizacion < '${today}' THEN NULL 
          ELSE fecha_finalizacion 
        END,
        suscripto = CASE 
          WHEN fecha_finalizacion < '${today}' THEN 0 
          ELSE suscripto 
        END
    `);

    const result = await sql.query("SELECT * FROM Usuarios");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error de conexión con SQL Server: ", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Suspender usuario por 1 dia
router.put("/suspender/:id", async (req, res) => {
  const { id } = req.params;
  console.log("ID del usuario:", id);

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "El ID del usuario no es válido." });
  }

  try {
    await sql.connect(config);
    const nuevaFecha = new Date();
    nuevaFecha.setDate(nuevaFecha.getDate() + 1);

    await sql.query`UPDATE Usuarios 
      SET fecha_fin_suspension = ${nuevaFecha}, 
          suspendido = 1, 
          suscripto = 0,
          fecha_finalizacion = 0 
      WHERE ID = ${id}`;

    res.json({ message: "Usuario suspendido por 1 día" });
  } catch (err) {
    console.error(`Error al suspender usuario con ID ${id}:`, err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Eliminar usuario
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  console.log("ID del usuario:", id);

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "El ID del usuario no es válido." });
  }
  try {
    await sql.connect(config);
    await sql.query`DELETE FROM Usuarios WHERE ID = ${id}`;
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Activar suscripción
router.put("/suscripcion/:id", async (req, res) => {
  const { id } = req.params;
  console.log("ID del usuario:", id);

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "El ID del usuario no es válido." });
  }
  try {
    await sql.connect(config);
    if (!id) {
      console.error("Error: El ID del usuario es undefined o null");
      return;
    }
    const result =
      await sql.query`SELECT suscripto, fecha_finalizacion FROM Usuarios WHERE ID = ${id}`;
    const usuario = result.recordset[0];

    let nuevaFecha;

    if (!usuario.suscripto) {
      nuevaFecha = new Date();
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      await sql.query`UPDATE Usuarios SET suscripto = 1, fecha_finalizacion = ${nuevaFecha}, fecha_fin_suspension = 0 WHERE ID = ${id}`;
      res.json({ message: "Suscripción activada por 1 mes desde hoy" });
    } else {
      nuevaFecha = new Date(usuario.fecha_finalizacion);
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      await sql.query`UPDATE Usuarios SET fecha_finalizacion = ${nuevaFecha}, fecha_fin_suspension = 0 WHERE ID = ${id}`;
      res.json({ message: "Suscripción extendida por 1 mes" });
    }
  } catch (err) {
    console.error("Error al activar suscripción:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// BACKUP
router.post("/crearBackup", async (req, res) => {
  try {
    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const nombreArchivo = `backup_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.bak`;
    const rutaArchivo = path.join(backupDir, nombreArchivo);

    await sql.query(
      `BACKUP DATABASE [InventoryTech] TO DISK = '${rutaArchivo}'`
    );

    await sql.query`INSERT INTO Backups (Nombre, RutaArchivo) VALUES (${nombreArchivo}, ${rutaArchivo})`;

    res.json({ message: "Backup creado exitosamente." });
  } catch (error) {
    console.error("Error al crear el backup:", error);
    res.status(500).json({ message: "Error al crear el backup" });
  }
});

// MOSTRAR LA LISTA DE BACKUPS
router.get("/listaBackups", async (req, res) => {
  try {
    const result =
      await sql.query`SELECT ID, Fecha, Nombre FROM Backups ORDER BY Fecha DESC`;

    if (!result.recordset) {
      res.json([]);
    } else {
      res.json(result.recordset);
    }
  } catch (error) {
    console.error("Error al obtener los backups:", error);
    res.status(500).json({ message: "Error al obtener los backups" });
  }
});

// RESTORE BACKUP
async function connectToMaster() {
  const masterConfig = { ...config, database: "master" };
  try {
    await sql.connect(masterConfig);
    console.log("Conectado a la base de datos master");
  } catch (error) {
    console.error("Error al conectar con la base de datos master:", error);
    throw error;
  }
}
const backupsDir = path.join(__dirname, "../backups");
router.post("/restaurarBackup", async (req, res) => {
  const { nombreArchivo } = req.body;
  if (!nombreArchivo) {
    return res
      .status(400)
      .json({ message: "No se proporcionó el nombre del archivo." });
  }

  const backupPath = path.join(backupsDir, nombreArchivo);
  if (!fs.existsSync(backupPath)) {
    return res
      .status(404)
      .json({ message: `El archivo ${nombreArchivo} no existe.` });
  }

  try {
    await sql.close();
    console.log("Conexión a la base de datos actual cerrada");

    await connectToMaster();

    const disconnectUsersQuery = `
      ALTER DATABASE InventoryTech
      SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    `;
    await sql.query(disconnectUsersQuery);

    const query = `
      RESTORE DATABASE InventoryTech
      FROM DISK = '${backupPath}'
      WITH REPLACE, RECOVERY;
    `;

    await sql.query(query, { timeout: 60000 });
    console.log(`Backup ${nombreArchivo} restaurado exitosamente`);

    const multiUserQuery = `
      ALTER DATABASE InventoryTech
      SET MULTI_USER;
    `;
    await sql.query(multiUserQuery);

    await sql.close();
    await sql.connect(config);
    console.log("Reconectado a InventoryTech");

    res.json({
      message: `Backup ${nombreArchivo} restaurado exitosamente en la base de datos InventoryTech.`,
    });
  } catch (error) {
    console.error("Error al restaurar el backup:", error);
    res
      .status(500)
      .json({ message: "Ocurrió un error al restaurar el backup." });
  }
});

// BITACORA
router.post("/registrarBitacora", async (req, res) => {
  const { usuario, accion } = req.body;
  const nuevaFecha = new Date();
  try {
    await sql.connect(config);
    const result =
      await sql.query`INSERT INTO Bitacora (fecha, usuario, accion) VALUES (${nuevaFecha}, ${usuario}, ${accion})`;
    res.status(201).json({ message: "Registro creado", id: result.insertId });
  } catch (err) {
    console.error("Error de conexión con SQL Server: ", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/mostrarBitacora", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query("SELECT * FROM Bitacora");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error de conexión con SQL Server: ", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
