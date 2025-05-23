const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();

var usuario;

router.post("/solicitarCodigo", async (req, res) => {
  const { username, email, seguridad } = req.body;
  usuario = "";
  usuario = username;
  try {
    await sql.connect(config);

    const userResult = await sql.query`
      SELECT * FROM Usuarios WHERE usuario = ${username} AND email = ${email} AND seguridad = ${seguridad}`;

    if (userResult.recordset.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Datos incorrectos." });
    }

    res.json({ success: true, message: "Verificación exitosa." });
  } catch (error) {
    console.error("Error al verificar usuario:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

router.post("/cambiarContrasena", async (req, res) => {
  const { nuevaContraseña, username } = req.body;
  console.log(usuario, username);
  try {
    await sql.connect(config);
    await sql.query`UPDATE Usuarios SET password = ${nuevaContraseña} WHERE usuario = ${usuario}`;
    res.json({ success: true, message: "Contraseña cambiada con éxito." });
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

module.exports = router;
