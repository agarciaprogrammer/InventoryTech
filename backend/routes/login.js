const express = require("express");
const { sql, config } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const SECRET_KEY = "inventorytech";

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  console.log("Solicitando login para:", username);

  try {
    await sql.connect(config);
    const result =
      await sql.query`SELECT * FROM Usuarios WHERE usuario = ${username}`;
    const user = result.recordset[0];

    if (!user) {
      return res
        .status(400)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

    if (password !== user.password) {
      return res
        .status(400)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

    const now = new Date();
    if (!user.suscripto || user.suspendido) {
      return res.status(403).json({
        message: "Acceso denegado: usuario no suscripto o suspendido.",
      });
    }

    if (user.fecha_finalizacion < now) {
      await sql.query`UPDATE Usuarios SET suscripto = 0 WHERE ID = ${user.ID}`;
      return res
        .status(403)
        .json({ message: "Acceso denegado: suscripción expirada." });
    }

    if (user.fecha_fin_suspension) {
      if (user.fecha_fin_suspension < now) {
        await sql.query`UPDATE Usuarios SET suspendido = 0, fecha_fin_suspension = NULL WHERE ID = ${user.ID}`;
      }
    }
    const token = jwt.sign({ id: user.ID, admin: user.admin }, SECRET_KEY, {
      expiresIn: "5h",
    });

    res.json({ token, admin: user.admin, nombre: user.usuario });
  } catch (err) {
    console.error("Error de conexión con SQL Server: ", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
