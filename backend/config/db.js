const sql = require("mssql");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "sa";
const DB_PASSWORD = process.env.DB_PASSWORD || "hola";
const DB_NAME = process.env.DB_NAME || "InventoryTech";

const config = {
  user: DB_USER,
  password: DB_PASSWORD,
  server: DB_HOST,
  database: DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function connectDB() {
  try {
    await sql.connect(config);
    console.log("Conectado a la base de datos");
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
  }
}

module.exports = { connectDB, sql, config };
