const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true
  }
};

// Crear la promesa de conexión una sola vez
const poolPromise = sql.connect(config);

module.exports = {
  sql,
  poolPromise,
  
  // Retorna la promesa del pool (para resolver db.getConnection is not a function)
  getConnection: () => poolPromise,
  
  // Permite hacer consultas directas si las necesitas: await db.query('SELECT...')
  query: async (text) => {
    const pool = await poolPromise;
    return pool.request().query(text);
  }
};