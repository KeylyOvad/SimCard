const sql = require('mssql');
require('dotenv').config();

console.log('DB_SERVER:', process.env.DB_SERVER);

console.log('DB_USER:', process.env.DB_USER);

console.log('DB_NAME:', process.env.DB_NAME);

console.log('PWD:', process.cwd());
 

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
  
  // Retorna la promesa del pool 
  getConnection: () => poolPromise,
  

  query: async (text) => {
    const pool = await poolPromise;
    return pool.request().query(text);
  }
};