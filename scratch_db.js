require('dotenv').config();
const pool = require('./src/config/db');

async function checkData() {
    try {
        console.log("Todos los ingresos:");
        const [ingresos] = await pool.query("SELECT id, codigo_ingreso, viaje, viaje_id FROM ingresos");
        console.table(ingresos);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkData();
