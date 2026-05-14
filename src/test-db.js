const db = require('./config/db');

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1 AS resultado');
    console.log('Conexión exitosa a MySQL:', rows);
  } catch (error) {
    console.error('Error de conexión:', error.message);
  } finally {
    process.exit();
  }
}

testConnection();
