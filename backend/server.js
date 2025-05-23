const { connectDB } = require("./config/db");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authenticateToken = require("../middle/authenticateToken");
const userToken = require("../middle/userToken");

const app = express();

const PORT = process.env.PORT || 3000;

const productosRouter = require("./routes/productos");
const ordenCompraRouter = require("./routes/ordencompra");
const ventasRouter = require("./routes/ventas");
const inflacionRouter = require("./routes/inflacionback");
const riesgoRouter = require("./routes/riesgo");
const demandaRouter = require("./routes/demanda");
const balanceRouter = require("./routes/balance");
const adminRouter = require("./routes/admin");
const usuarioRouter = require("./routes/usuario");
const loginRouter = require("./routes/login");
const verificarRouter = require("./routes/verificar");
const contraseñaRouter = require("./routes/cambiarcontraseña");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Aplica el middleware de autenticación a todas las rutas excepto el login
app.use("/productos", authenticateToken, userToken, productosRouter);
app.use("/ordencompra", authenticateToken, ordenCompraRouter);
app.use("/ventas", authenticateToken, ventasRouter);
app.use("/inflacion", authenticateToken, inflacionRouter);
app.use("/riesgo", authenticateToken, riesgoRouter);
app.use("/demanda", authenticateToken, demandaRouter);
app.use("/balance", authenticateToken, balanceRouter);
app.use("/admin", authenticateToken, adminRouter);
app.use("/usuario", usuarioRouter);
app.use("/login", loginRouter);
app.use("/verificar", verificarRouter);
app.use("/contrasena", contraseñaRouter);

app.listen(PORT);
console.log(`Servidor escuchando en el puerto ${PORT}`);
