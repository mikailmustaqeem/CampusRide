const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const auth = require('../middleware/authMiddleware');

// GET - Search rides (no auth needed)
router.get('/', async (req, res) => {
    try {
        const { source, destination, date } = req.query;
        const pool = getPool();
        
        let query = `
            SELECT r.RideID, r.DriverID, u.Name as DriverName, u.Rating as DriverRating,
                   r.Source, r.Destination, r.DepartureTime, r.AvailableSeats, r.PricePerSeat, r.Status,
                   v.Make as VehicleMake, v.Model as VehicleModel, v.Color as VehicleColor
            FROM Rides r
            LEFT JOIN Users u ON r.DriverID = u.UserID
            LEFT JOIN Vehicles v ON r.VehicleID = v.VehicleID
            WHERE r.Status = 'Active' AND r.DepartureTime > GETDATE()
        `;
        
        const request = pool.request();
        const conditions = [];

        if (source) {
            conditions.push("r.Source LIKE '%' + @source + '%'");
            request.input('source', sql.VarChar, source);
        }
        if (destination) {
            conditions.push("r.Destination LIKE '%' + @dest + '%'");
            request.input('dest', sql.VarChar, destination);
        }
        if (date) {
            conditions.push("CAST(r.DepartureTime AS DATE) = @date");
            request.input('date', sql.Date, date);
        }

        if (conditions.length > 0) {
            query += " AND " + conditions.join(" AND ");
        }

        query += `
            ORDER BY r.CreatedAt DESC, r.RideID DESC
        `;

        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ NEW — GET /api/rides/my — Driver's own rides
router.get('/my', auth, async (req, res) => {
    try {
        const driverId = req.user.userId;
        const pool = getPool();

        const result = await pool.request()
            .input('DriverID', sql.Int, driverId)
            .query(`
                SELECT r.RideID, r.DriverID, r.Source, r.Destination,
                       r.DepartureTime, r.AvailableSeats, r.PricePerSeat, r.Status,
                       v.Make as VehicleMake, v.Model as VehicleModel, v.Color as VehicleColor,
                       (SELECT COUNT(*) FROM Bookings b WHERE b.RideID = r.RideID AND b.Status = 'Confirmed') as BookingsCount
                FROM Rides r
                LEFT JOIN Vehicles v ON r.VehicleID = v.VehicleID
                WHERE r.DriverID = @DriverID
                ORDER BY r.CreatedAt DESC, r.RideID DESC
            `);

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('My rides error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET - Get single ride (no auth needed) — MUST be after /my
router.get('/:id', async (req, res) => {
    try {
        const rideId = req.params.id;
        const pool = getPool();

        const rideQuery = `
            SELECT r.RideID, r.DriverID, u.Name as DriverName, u.Rating as DriverRating,
                   r.Source, r.Destination, r.DepartureTime, r.AvailableSeats, r.PricePerSeat, r.Status,
                   v.Make as VehicleMake, v.Model as VehicleModel, v.Color as VehicleColor
            FROM Rides r
            LEFT JOIN Users u ON r.DriverID = u.UserID
            LEFT JOIN Vehicles v ON r.VehicleID = v.VehicleID
            WHERE r.RideID = @id
        `;
        
        const rideResult = await pool.request()
            .input('id', sql.Int, rideId)
            .query(rideQuery);

        if (rideResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }

        const ride = rideResult.recordset[0];

        const waypointsResult = await pool.request()
            .input('id', sql.Int, rideId)
            .query(`SELECT * FROM Routes WHERE RideID = @id ORDER BY WaypointOrder`);

        res.json({ success: true, data: { ...ride, waypoints: waypointsResult.recordset } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST - Create a new ride
router.post('/', auth, async (req, res) => {
    try {
        const { source, destination, departureTime, availableSeats, pricePerSeat, vehicleId } = req.body;
        const driverId = req.user.userId || req.user.UserID;
        const pool = getPool();
        
        await pool.request()
            .input('DriverID', sql.Int, driverId)
            .input('VehicleID', sql.Int, vehicleId)
            .input('Source', sql.VarChar, source)
            .input('Destination', sql.VarChar, destination)
            .input('DepartureTime', sql.DateTime, departureTime)
            .input('AvailableSeats', sql.Int, availableSeats)
            .input('PricePerSeat', sql.Decimal, pricePerSeat)
            .input('Status', sql.VarChar, 'Active')
            .query(`
                INSERT INTO Rides (DriverID, VehicleID, Source, Destination, DepartureTime, AvailableSeats, PricePerSeat, Status)
                VALUES (@DriverID, @VehicleID, @Source, @Destination, @DepartureTime, @AvailableSeats, @PricePerSeat, @Status)
            `);
        
        res.status(201).json({ success: true, message: 'Ride created successfully' });
    } catch (error) {
        console.error('Create ride error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT - Update a ride
router.put('/:id', auth, async (req, res) => {
    try {
        const rideId = req.params.id;
        const { source, destination, departureTime, availableSeats, pricePerSeat } = req.body;
        const driverId = req.user.userId || req.user.UserID;
        const pool = getPool();
        
        const checkRide = await pool.request()
            .input('RideID', sql.Int, rideId)
            .input('DriverID', sql.Int, driverId)
            .query('SELECT RideID FROM Rides WHERE RideID = @RideID AND DriverID = @DriverID');
        
        if (checkRide.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Ride not found or not yours' });
        }
        
        await pool.request()
            .input('RideID', sql.Int, rideId)
            .input('Source', sql.VarChar, source)
            .input('Destination', sql.VarChar, destination)
            .input('DepartureTime', sql.DateTime, departureTime)
            .input('AvailableSeats', sql.Int, availableSeats)
            .input('PricePerSeat', sql.Decimal, pricePerSeat)
            .query(`
                UPDATE Rides 
                SET Source = @Source, Destination = @Destination, DepartureTime = @DepartureTime,
                    AvailableSeats = @AvailableSeats, PricePerSeat = @PricePerSeat
                WHERE RideID = @RideID
            `);
        
        res.status(200).json({ success: true, message: `Ride ${rideId} updated successfully` });
    } catch (error) {
        console.error('Update ride error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE - Delete a ride
router.delete('/:id', auth, async (req, res) => {
    try {
        const rideId = req.params.id;
        const driverId = req.user.userId || req.user.UserID;
        const pool = getPool();
        
        const checkRide = await pool.request()
            .input('RideID', sql.Int, rideId)
            .input('DriverID', sql.Int, driverId)
            .query('SELECT RideID FROM Rides WHERE RideID = @RideID AND DriverID = @DriverID');
        
        if (checkRide.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Ride not found or not yours' });
        }
        
        await pool.request()
            .input('RideID', sql.Int, rideId)
            .query('DELETE FROM Rides WHERE RideID = @RideID');
        
        res.status(200).json({ success: true, message: `Ride ${rideId} deleted successfully` });
    } catch (error) {
        console.error('Delete ride error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/rides/:id/complete - Mark ride as completed by driver
router.put('/:id/complete', auth, async (req, res) => {
    try {
        const rideId = req.params.id;
        const driverId = req.user.userId;
        const pool = getPool();
        
        // Check if ride exists and belongs to driver
        const rideCheck = await pool.request()
            .input('RideID', sql.Int, rideId)
            .input('DriverID', sql.Int, driverId)
            .query(`
                SELECT r.RideID, r.Source, r.Destination, r.Status, r.DepartureTime
                FROM Rides r
                WHERE r.RideID = @RideID AND r.DriverID = @DriverID
            `);
        
        if (rideCheck.recordset.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Ride not found or not owned by you' 
            });
        }
        
        const ride = rideCheck.recordset[0];
        
        if (ride.Status === 'Completed') {
            return res.status(400).json({ 
                success: false, 
                message: 'Ride is already marked as completed' 
            });
        }
        
        if (ride.Status === 'Cancelled') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot complete a cancelled ride' 
            });
        }
        
        // Update ride status to Completed
        await pool.request()
            .input('RideID', sql.Int, rideId)
            .query(`UPDATE Rides SET Status = 'Completed' WHERE RideID = @RideID`);
        
        // Get all passengers who booked this ride
        const passengers = await pool.request()
            .input('RideID', sql.Int, rideId)
            .query(`
                SELECT DISTINCT b.PassengerID, u.Name
                FROM Bookings b
                JOIN Users u ON b.PassengerID = u.UserID
                WHERE b.RideID = @RideID AND b.Status = 'Confirmed'
            `);
        
        // Create notification for each passenger
        for (const passenger of passengers.recordset) {
            await pool.request()
                .input('UserID', sql.Int, passenger.PassengerID)
                .input('Type', sql.NVarChar, 'RideUpdate')
                .input('Message', sql.NVarChar, 
                    `✅ Ride completed: ${ride.Source} → ${ride.Destination}. Rate your driver now!`)
                .query(`
                    INSERT INTO Notifications (UserID, Type, Message, IsRead, CreatedAt)
                    VALUES (@UserID, @Type, @Message, 0, GETDATE())
                `);
        }
        
        res.json({ 
            success: true, 
            message: 'Ride marked as completed!',
            notificationsSent: passengers.recordset.length
        });
        
    } catch (error) {
        console.error('Complete ride error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;