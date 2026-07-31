const { poolPromise } = require('./src/config/db');

async function test() {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(
      "SELECT @@SERVERNAME AS servidor"
    );

    console.log(result.recordset);

  } catch (error) {
    console.error(error);
  }
}

test();