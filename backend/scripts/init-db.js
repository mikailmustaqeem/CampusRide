/**
 * Applies Group5-phase1.sql to the CampusRide database (creates all tables).
 * Run: npm run db:init   (SQL Server / Azure SQL Edge must be running)
 *
 * If login logs show "Invalid object name 'Users'", this script has not been
 * applied to the database named in backend/.env (or the Docker volume was reset).
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDB, getPool } = require('../config/db');

async function main() {
    const dbName = process.env.DB_DATABASE || 'CampusRide';
    const sqlPath = path.join(__dirname, '..', '..', 'Group5-phase1.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('Missing schema file:', sqlPath);
        process.exit(1);
    }

    const poolReady = await connectDB();
    if (!poolReady) {
        process.exit(1);
    }

    const pool = getPool();

    const scope = await pool.request().query('SELECT DB_NAME() AS db');
    const currentDb = scope.recordset[0].db;
    console.log(`Session database: ${currentDb} (expected: ${dbName})`);

    const exists = await pool.request().query(`
        SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Users'
    `);
    if (exists.recordset.length > 0) {
        console.log('✓ dbo.Users already exists — schema is present.');
        console.log('If you still see "Invalid object name \'Users\'", the API may be using a different database; set DB_DATABASE in .env and restart.');
        process.exit(0);
    }

    console.log('Table dbo.Users is missing — applying Group5-phase1.sql …');
    let sql = fs.readFileSync(sqlPath, 'utf8').replace(/^\uFEFF/, '');

    const batches = sql.split(/\r?\n\s*GO\s*\r?\n/i);
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i].trim();
        if (!batch) continue;
        try {
            await pool.request().query(batch);
            console.log(`✓ batch ${i + 1}/${batches.length} applied`);
        } catch (err) {
            console.error(`✗ batch ${i + 1} failed:`, err.message);
            process.exit(1);
        }
    }
    console.log('Database schema is ready. You can sign up or log in now.');
    process.exit(0);
}

main();
