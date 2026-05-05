const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const auth = require('../middleware/authMiddleware');

// GET /api/notifications — Get all notifications for logged in user
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = getPool();

        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`SELECT TOP 20 NotificationID, Type, Message, IsRead, CreatedAt
                    FROM Notifications
                    WHERE UserID = @UserID
                    ORDER BY CreatedAt DESC`);

        const unreadCount = result.recordset.filter(n => !n.IsRead).length;

        res.json({ success: true, data: result.recordset, unreadCount });
    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/notifications/unread-count — Badge in navbar (no row payload)
router.get('/unread-count', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`SELECT COUNT(*) AS cnt
                    FROM Notifications
                    WHERE UserID = @UserID AND (IsRead = 0 OR IsRead IS NULL)`);
        const unreadCount = Number(result.recordset[0]?.cnt ?? 0);
        res.json({ success: true, unreadCount });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/notifications/read-all — Mark all as read
router.put('/read-all', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = getPool();

        await pool.request()
            .input('UserID', sql.Int, userId)
            .query('UPDATE Notifications SET IsRead = 1 WHERE UserID = @UserID');

        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/notifications/:id/read — Mark one as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const pool = getPool();
        await pool.request()
            .input('NotificationID', sql.Int, req.params.id)
            .query('UPDATE Notifications SET IsRead = 1 WHERE NotificationID = @NotificationID');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;