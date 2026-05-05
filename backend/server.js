const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    const port = process.env.PORT || 5001;
    res.type('html').send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>CampusRide API</title></head>
<body style="font-family: system-ui; max-width: 40rem; margin: 2rem;">
  <h1>CampusRide API</h1>
  <p>This URL is the <strong>backend only</strong>. There is no web UI here.</p>
  <p>Open the React app from the <code>frontend</code> folder (usually <a href="http://localhost:5173">http://localhost:5173</a> after <code>npm run dev</code>).</p>
  <p>API base: <code>http://localhost:${port}/api/…</code></p>
</body></html>`);
});

// ==================== API ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));           // ← NEW
app.use('/api/notifications', require('./routes/notifications')); // ← NEW
app.use('/api/vehicles', require('./routes/vehicles')); // ← ADD THIS

const PORT = process.env.PORT || 5001;

// ==================== START SERVER ====================
connectDB().then((pool) => {
    if (!pool) {
        console.error('❌ Could not connect to database. Server not started.');
        process.exit(1);
    }

    app.get('/api/health', async (req, res) => {
        try {
            const r = await pool.request().query(`
                SELECT DB_NAME() AS db, OBJECT_ID(N'dbo.Users', N'U') AS usersTable
            `);
            const row = r.recordset[0];
            res.json({
                ok: true,
                database: row.db,
                hasUsersTable: row.usersTable != null,
                apiPort: PORT,
            });
        } catch (e) {
            res.status(500).json({ ok: false, error: e.message });
        }
    });

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health`);
        console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES ✅' : 'NO ❌');
    }).on('error', (err) => {
        console.error('❌ Could not listen on port', PORT, err.code || err.message);
        if (err.code === 'EADDRINUSE') {
            console.error('   Another process is using this port. Stop it or change PORT in .env.');
        }
        process.exit(1);
    });
});