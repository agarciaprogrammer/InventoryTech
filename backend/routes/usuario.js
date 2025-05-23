const express = require("express");
const { sql, config } = require("../config/db");
const router = express.Router();

router.post("/registrarUsuario", async (req, res) => {
  const { username, email, password, telefono, seguridad } = req.body;
  const suscripto = 0;
  const admin = 0;

  try {
    await sql.connect(config);
    await sql.query`INSERT INTO Usuarios (usuario, email, password, telefono, seguridad, suscripto, admin) VALUES (${username}, ${email}, ${password}, ${telefono}, ${seguridad}, ${suscripto}, ${admin})`;

    res.status(201).json({ message: "Usuario registrado exitosamente." });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).json({ message: "Error al registrar el usuario." });
  }
});

module.exports = router;
