const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const auth = require('../middleware/authMiddleware');

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

// POST /api/bookings
router.post('/', auth, async (req, res) => {
    try {
        const { rideId, seatsToBook } = req.body;
        const passengerId = req.user.userId || req.user.UserID;
        const pool = getPool();

        const rideResult = await pool.request()
            .input('RideID', sql.Int, rideId)
            .query('SELECT AvailableSeats, PricePerSeat, Status, DriverID, Source, Destination FROM Rides WHERE RideID = @RideID');

        if (rideResult.recordset.length === 0)
            return res.status(404).json({ success: false, message: 'Ride not found' });

        const ride = rideResult.recordset[0];

        if (ride.Status !== 'Active')
            return res.status(400).json({ success: false, message: 'Ride is no longer active' });

        if (ride.AvailableSeats < seatsToBook)
            return res.status(400).json({ success: false, message: 'Not enough seats available' });

        // ✅ Check for existing confirmed booking
        const existingBooking = await pool.request()
            .input('RideID', sql.Int, rideId)
            .input('PassengerID', sql.Int, passengerId)
            .query(`
                SELECT b.BookingID, b.SeatsBooked
                FROM Bookings b
                WHERE b.RideID = @RideID
                  AND b.PassengerID = @PassengerID
                  AND b.Status = 'Confirmed'
            `);

        if (existingBooking.recordset.length > 0) {
            const existingBookingId = existingBooking.recordset[0].BookingID;

            // Check if already paid
            const existingPayment = await pool.request()
                .input('BookingID', sql.Int, existingBookingId)
                .query(`
                    SELECT PaymentID FROM Payments
                    WHERE BookingID = @BookingID
                      AND TransactionStatus = 'Completed'
                `);

            if (existingPayment.recordset.length > 0) {
                // Already paid — block
                return res.status(400).json({
                    success: false,
                    message: 'You have already booked and paid for this ride.'
                });
            } else {
                // Confirmed but unpaid — send to payment
                return res.status(400).json({
                    success: false,
                    message: 'You already have a pending booking. Please complete your payment.',
                    bookingId: existingBookingId,
                    totalFare: existingBooking.recordset[0].SeatsBooked * ride.PricePerSeat,
                    source: ride.Source,
                    destination: ride.Destination,
                    redirectToPayment: true
                });
            }
        }

        // ✅ Fresh booking — calculate fare only for new seats
        const totalFare = ride.PricePerSeat * seatsToBook;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const req1 = new sql.Request(transaction);
            const bookingResult = await req1
                .input('RideID', sql.Int, rideId)
                .input('PassengerID', sql.Int, passengerId)
                .input('SeatsBooked', sql.Int, seatsToBook)
                .input('TotalFare', sql.Decimal(10, 2), totalFare)
                .query(`
                    INSERT INTO Bookings (RideID, PassengerID, SeatsBooked, TotalFare, BookingTime, Status)
                    VALUES (@RideID, @PassengerID, @SeatsBooked, @TotalFare, GETDATE(), 'Confirmed');
                    SELECT SCOPE_IDENTITY() AS BookingID;
                `);

            const bookingId = bookingResult.recordset[0].BookingID;

            const req2 = new sql.Request(transaction);
            await req2
                .input('RideID', sql.Int, rideId)
                .input('SeatsBooked', sql.Int, seatsToBook)
                .query(`UPDATE Rides SET AvailableSeats = AvailableSeats - @SeatsBooked WHERE RideID = @RideID`);

            await transaction.commit();

            await insertNotification(passengerId, 'Booking',
                `Your booking is confirmed! ${seatsToBook} seat(s) on ride from ${ride.Source} to ${ride.Destination}.`);
            await insertNotification(ride.DriverID, 'Booking',
                `New booking! A passenger booked ${seatsToBook} seat(s) on your ride from ${ride.Source} to ${ride.Destination}.`);

            return res.status(201).json({
                success: true,
                message: 'Booking confirmed!',
                bookingId,
                totalFare,
                isUpdate: false
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/bookings/my
router.get('/my', auth, async (req, res) => {
    try {
        const passengerId = req.user.userId || req.user.UserID;
        const pool = getPool();

        const result = await pool.request()
            .input('PassengerID', sql.Int, passengerId)
            .query(`
                SELECT b.BookingID, b.SeatsBooked, b.TotalFare, b.BookingTime, b.Status as BookingStatus,
                       r.RideID, r.Source, r.Destination, r.DepartureTime, r.Status as RideStatus,
                       u.Name as DriverName, u.UserID as DriverID
                FROM Bookings b
                JOIN Rides r ON b.RideID = r.RideID
                JOIN Users u ON r.DriverID = u.UserID
                WHERE b.PassengerID = @PassengerID
                ORDER BY b.BookingTime DESC
            `);

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const passengerId = req.user.userId || req.user.UserID;
        const pool = getPool();

        const bookingResult = await pool.request()
            .input('BookingID', sql.Int, bookingId)
            .input('PassengerID', sql.Int, passengerId)
            .query(`
                SELECT b.RideID, b.SeatsBooked, b.Status
                FROM Bookings b
                WHERE b.BookingID = @BookingID AND b.PassengerID = @PassengerID
            `);

        if (bookingResult.recordset.length === 0)
            return res.status(404).json({ success: false, message: 'Booking not found' });

        const booking = bookingResult.recordset[0];

        if (booking.Status !== 'Confirmed')
            return res.status(400).json({ success: false, message: 'Only confirmed bookings can be cancelled' });

        const rideInfo = await pool.request()
            .input('RideID', sql.Int, booking.RideID)
            .query('SELECT Source, Destination, DriverID FROM Rides WHERE RideID = @RideID');
        const ride = rideInfo.recordset[0];

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const req1 = new sql.Request(transaction);
            await req1
                .input('BookingID', sql.Int, bookingId)
                .query(`UPDATE Bookings SET Status = 'Cancelled' WHERE BookingID = @BookingID`);

            const req2 = new sql.Request(transaction);
            await req2
                .input('RideID', sql.Int, booking.RideID)
                .input('SeatsBooked', sql.Int, booking.SeatsBooked)
                .query(`UPDATE Rides SET AvailableSeats = AvailableSeats + @SeatsBooked WHERE RideID = @RideID`);

            await transaction.commit();

            await insertNotification(passengerId, 'Booking',
                `Your booking on ride from ${ride.Source} to ${ride.Destination} has been cancelled.`);
            await insertNotification(ride.DriverID, 'Booking',
                `A passenger cancelled their booking on your ride from ${ride.Source} to ${ride.Destination}. ${booking.SeatsBooked} seat(s) restored.`);

            res.json({ success: true, message: 'Booking cancelled successfully' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;