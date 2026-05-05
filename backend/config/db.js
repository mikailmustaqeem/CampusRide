const sql = require('mssql');

function buildDbConfig() {
    const server = process.env.DB_SERVER || 'localhost';

    const dbConfig = {
        server,
        database: process.env.DB_DATABASE || 'CampusRide',
        user: process.env.DB_USER || 'campusride_user',
        password: process.env.DB_PASSWORD || 'campusride123',
        options: {
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
            enableArithAbort: true,
        },
        connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT) || 30000,
    };

    const port = process.env.DB_PORT;
    if (port !== undefined && port !== '') {
        dbConfig.port = parseInt(port, 10);
    } else if (!/\\/.test(server)) {
        dbConfig.port = 1433;
    }

    return dbConfig;
}

const dbConfig = buildDbConfig();

let globalPool = null;

const connectDB = async () => {
    try {
        const target =
            dbConfig.port != null ? `${dbConfig.server}:${dbConfig.port}` : dbConfig.server;
        console.log('Connecting to SQL Server...', target, `db=${dbConfig.database}`);
        globalPool = await sql.connect(dbConfig);
        const dbName = dbConfig.database;
        if (dbName) {
            const esc = String(dbName).replace(/\]/g, ']]');
            await globalPool.request().query(`USE [${esc}]`);
        }
        console.log('✅ Connected to SQL Server');
        return globalPool;
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        return null;
    }
};

const getPool = () => {
    if (!globalPool) {
        throw new Error('Database not connected. Call connectDB first.');
    }
    return globalPool;
};

module.exports = { sql, getPool, connectDB };
