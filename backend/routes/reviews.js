const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const auth = require('../middleware/authMiddleware');

// Helper: insert notification
const insertNotification = async (userId, type, message) => {
    try {
        const pool = getPool();
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('Type', sql.NVarChar, type)
            .input('Message', sql.NVarChar, message)
            .query(`INSERT INTO Notifications (UserID, Type, Message, IsRead, CreatedAt)
                    VALUES (@UserID, @Type, @Message, 0, GETDATE())`);
    } catch (err) {
        console.error('Notification failed:', err.message);
    }
};

// POST /api/reviews — Submit a review
router.post('/', auth, async (req, res) => {
    try {
        const { revieweeId, rideId, rating, comment } = req.body;
        const reviewerId = req.user.userId;

        if (!revieweeId || !rideId || !rating) {
            return res.status(400).json({ success: false, message: 'revieweeId, rideId and rating are required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const pool = getPool();

        const rideInfo = await pool.request()
            .input('RideID', sql.Int, rideId)
            .query('SELECT Source, Destination, DriverID, Status FROM Rides WHERE RideID = @RideID');
        const ride = rideInfo.recordset[0];

        if (!ride) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }

        if (ride.Status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Cancelled rides cannot be reviewed' });
        }
        if (ride.Status !== 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'You can only review after the driver has marked the ride as completed.',
            });
        }

        if (Number(revieweeId) !== Number(ride.DriverID)) {
            return res.status(400).json({ success: false, message: 'Invalid driver for this ride' });
        }

        const bookingOk = await pool.request()
            .input('RideID', sql.Int, rideId)
            .input('PassengerID', sql.Int, reviewerId)
            .query(`SELECT b.BookingID FROM Bookings b
                    INNER JOIN Payments p ON p.BookingID = b.BookingID AND p.TransactionStatus = 'Completed'
                    WHERE b.RideID = @RideID AND b.PassengerID = @PassengerID
                    AND b.Status IN ('Confirmed', 'Completed')`);

        if (bookingOk.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You need a paid booking on this completed ride before you can leave a review',
            });
        }

        // Check if already reviewed
        const existing = await pool.request()
            .input('ReviewerID', sql.Int, reviewerId)
            .input('RideID', sql.Int, rideId)
            .input('RevieweeID', sql.Int, revieweeId)
            .query('SELECT ReviewID FROM Reviews WHERE ReviewerID = @ReviewerID AND RideID = @RideID AND RevieweeID = @RevieweeID');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this ride' });
        }

        // Get reviewee name
        const revieweeInfo = await pool.request()
            .input('RevieweeID', sql.Int, revieweeId)
            .query('SELECT Name FROM Users WHERE UserID = @RevieweeID');
        const revieweeName = revieweeInfo.recordset[0]?.Name || 'the driver';

        // Insert review
        await pool.request()
            .input('ReviewerID', sql.Int, reviewerId)
            .input('RevieweeID', sql.Int, revieweeId)
            .input('RideID', sql.Int, rideId)
            .input('Rating', sql.Decimal(2, 1), rating)
            .input('Comment', sql.NVarChar, comment || '')
            .query(`INSERT INTO Reviews (ReviewerID, RevieweeID, RideID, Rating, Comment, Timestamp)
                    VALUES (@ReviewerID, @RevieweeID, @RideID, @Rating, @Comment, GETDATE())`);

        // Update reviewee's average rating in Users table
        await pool.request()
            .input('RevieweeID', sql.Int, revieweeId)
            .query(`UPDATE Users SET Rating = (
                        SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM Reviews WHERE RevieweeID = @RevieweeID
                    ) WHERE UserID = @RevieweeID`);

        // 🔔 Send notification to reviewer (confirmation)
        await insertNotification(reviewerId, 'System',
            `Your review for ${revieweeName} has been submitted. Rating: ${rating}/5. Ride: ${ride.Source} → ${ride.Destination}`);

        // 🔔 Send notification to reviewee (someone reviewed them)
        await insertNotification(revieweeId, 'System',
            `You received a ${rating}/5 rating from a passenger after the ride from ${ride.Source} → ${ride.Destination}.`);

        res.status(201).json({ success: true, message: 'Review submitted!' });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/reviews/my — Get reviews I gave and received
router.get('/my', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = getPool();

        // Reviews I gave
        const given = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`SELECT r.ReviewID, r.Rating, r.Comment, r.Timestamp,
                           u.Name AS RevieweeName, u.Role AS RevieweeRole,
                           ri.Source, ri.Destination
                    FROM Reviews r
                    JOIN Users u ON r.RevieweeID = u.UserID
                    JOIN Rides ri ON r.RideID = ri.RideID
                    WHERE r.ReviewerID = @UserID
                    ORDER BY r.Timestamp DESC`);

        // Reviews I received
        const received = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`SELECT r.ReviewID, r.Rating, r.Comment, r.Timestamp,
                           u.Name AS ReviewerName, u.Role AS ReviewerRole,
                           ri.Source, ri.Destination
                    FROM Reviews r
                    JOIN Users u ON r.ReviewerID = u.UserID
                    JOIN Rides ri ON r.RideID = ri.RideID
                    WHERE r.RevieweeID = @UserID
                    ORDER BY r.Timestamp DESC`);

        // My avg rating
        const avgResult = await pool.request()
            .input('UserID', sql.Int, userId)
            .query('SELECT Rating FROM Users WHERE UserID = @UserID');

        res.json({
            success: true,
            given: given.recordset,
            received: received.recordset,
            avgRating: avgResult.recordset[0]?.Rating || 0
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/reviews/bookings — Get bookings eligible for review
router.get('/bookings', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = getPool();

        const result = await pool.request()
            .input('PassengerID', sql.Int, userId)
            .query(`SELECT b.BookingID, b.RideID, r.Source, r.Destination,
                           r.DepartureTime, u.Name AS DriverName, u.UserID AS DriverID,
                           r.Status AS RideStatus
                    FROM Bookings b
                    JOIN Rides r ON b.RideID = r.RideID
                    JOIN Users u ON r.DriverID = u.UserID
                    WHERE b.PassengerID = @PassengerID
                    AND b.Status IN ('Confirmed', 'Completed')
                    AND r.Status = 'Completed'
                    AND EXISTS (
                        SELECT 1 FROM Payments p
                        WHERE p.BookingID = b.BookingID AND p.TransactionStatus = 'Completed'
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM Reviews rv
                        WHERE rv.ReviewerID = @PassengerID
                        AND rv.RideID = b.RideID
                        AND rv.RevieweeID = r.DriverID
                    )
                    ORDER BY b.BookingTime DESC`);

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Reviewable bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;