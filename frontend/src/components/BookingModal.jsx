import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingModal = ({ ride, isOpen, onClose }) => {
    const [seatsToBook, setSeatsToBook] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    if (!isOpen || !ride) return null;

    const handleBook = async () => {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
            setError('You are not logged in. Please log in first.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rideId: ride.RideID,
                    seatsToBook: seatsToBook
                })
            });

            const data = await response.json();
            console.log('Booking response:', data);

            if (response.ok && data.success) {
                const paymentData = {
                    bookingId: data.bookingId,
                    totalFare: data.totalFare,
                    source: ride.Source,
                    destination: ride.Destination
                };
                sessionStorage.setItem('pendingPayment', JSON.stringify(paymentData));
                navigate('/payment', { state: paymentData });
                onClose();

            } else if (data.redirectToPayment) {
                // Already has an unpaid booking — redirect to complete payment
                const paymentData = {
                    bookingId: data.bookingId,
                    totalFare: data.totalFare,
                    source: data.source,
                    destination: data.destination
                };
                sessionStorage.setItem('pendingPayment', JSON.stringify(paymentData));
                navigate('/payment', { state: paymentData });
                onClose();

            } else {
                setError(data.message || 'Failed to book ride');
            }

        } catch (err) {
            console.error('Booking error:', err);
            setError('Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: 24, padding: 32,
                width: '100%', maxWidth: 420, margin: '0 16px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>

                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
                    Book Ride
                </h2>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>
                    {ride.Source} → {ride.Destination}
                </p>

                <div style={{ background: '#f8f7ff', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                    {[
                        ['Driver', ride.DriverName],
                        ['Available Seats', ride.AvailableSeats],
                        ['Price per Seat', `Rs. ${ride.PricePerSeat}`],
                    ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                            fontSize: 13, padding: '4px 0' }}>
                            <span style={{ color: '#999' }}>{label}</span>
                            <span style={{ fontWeight: 600, color: '#333' }}>{value}</span>
                        </div>
                    ))}
                </div>

                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', margin: '0 0 10px' }}>
                    Seats to Book
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <button onClick={() => setSeatsToBook(prev => Math.max(1, prev - 1))}
                        style={{ width: 40, height: 40, borderRadius: '50%',
                            border: '1.5px solid #e5e7eb', background: '#f9fafb',
                            fontSize: 20, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                        −
                    </button>
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#7C3AED',
                        minWidth: 32, textAlign: 'center' }}>
                        {seatsToBook}
                    </span>
                    <button onClick={() => setSeatsToBook(prev => Math.min(ride.AvailableSeats, prev + 1))}
                        style={{ width: 40, height: 40, borderRadius: '50%',
                            border: '1.5px solid #e5e7eb', background: '#f9fafb',
                            fontSize: 20, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                        +
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f5f3ff', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>Total Estimated</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#7C3AED' }}>
                        Rs. {ride.PricePerSeat * seatsToBook}
                    </span>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                        <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onClose}
                        style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                            background: '#f3f4f6', color: '#555', fontSize: 14,
                            fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={handleBook} disabled={loading}
                        style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                            background: loading ? '#c4b5fd' : '#7C3AED', color: 'white',
                            fontSize: 14, fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? 'Booking...' : 'Confirm Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;