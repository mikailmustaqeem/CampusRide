import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal, NoticeModal } from '../components/ThemeModals';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState({});
    const [loading, setLoading] = useState(true);
    const [cancelBookingId, setCancelBookingId] = useState(null);
    const [notice, setNotice] = useState(null);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const fetchBookings = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/bookings/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) { setBookings([]); return; }
            const bookingList = Array.isArray(data.data) ? data.data : [];
            setBookings(bookingList);

            const paymentMap = {};
            await Promise.all(bookingList.map(async (b) => {
                try {
                    const res = await fetch(`http://localhost:5001/api/payments/booking/${b.BookingID}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const pData = await res.json();
                    paymentMap[b.BookingID] = pData.success && pData.paid ? pData.payment : null;
                } catch {
                    paymentMap[b.BookingID] = null;
                }
            }));
            setPayments(paymentMap);

        } catch (error) {
            console.error('Error:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);

    const handleCancel = async (bookingId) => {
        setCancelBookingId(bookingId);
    };

    const confirmCancelBooking = async () => {
        const bookingId = cancelBookingId;
        setCancelBookingId(null);
        if (bookingId == null) return;
        try {
            const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchBookings();
                setNotice({ variant: 'success', title: 'Booking cancelled', message: 'Your booking has been cancelled.' });
            } else {
                const data = await response.json();
                setNotice({ variant: 'error', message: data.message || 'Failed to cancel' });
            }
        } catch (error) {
            console.error('Cancellation error:', error);
            setNotice({ variant: 'error', message: 'Could not cancel this booking. Try again.' });
        }
    };

    const statusColor = (status) => {
        if (status === 'Confirmed') return '#a78bfa';
        if (status === 'Cancelled') return '#f87171';
        if (status === 'Completed') return '#34d399';
        return '#a1a1aa';
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0e0c15', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif", color: '#a78bfa' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');`}</style>
            Loading…
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0e0c15', fontFamily: "'Sora', sans-serif",
            position: 'relative', overflow: 'hidden' }}>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
                .booking-card { transition: border-color 0.2s; }
                .booking-card:hover { border-color: rgba(139,92,246,0.4) !important; }
                .cancel-btn:hover { background: rgba(239,68,68,0.2) !important; }
                .paynow-btn:hover { background: rgba(167,139,250,0.25) !important; }
            `}</style>

            <Navbar />

            <ConfirmModal
                open={cancelBookingId != null}
                title="Cancel booking?"
                message="Are you sure you want to cancel this booking? This cannot be undone."
                confirmText="Yes, cancel"
                cancelText="Keep booking"
                danger
                onConfirm={confirmCancelBooking}
                onCancel={() => setCancelBookingId(null)}
            />
            <NoticeModal
                open={notice != null}
                title={notice?.title}
                message={notice?.message ?? ''}
                variant={notice?.variant ?? 'info'}
                onClose={() => setNotice(null)}
            />

            <div style={{ padding: '48px 24px', position: 'relative' }}>

                <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                    top: -80, left: -80, background: 'rgba(124,58,237,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%',
                    bottom: 40, right: -60, background: 'rgba(167,139,250,0.07)', filter: 'blur(60px)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>

                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '4px 14px', borderRadius: 999, background: 'rgba(109,40,217,0.15)',
                            border: '1px solid rgba(139,92,246,0.3)', fontSize: 11, fontWeight: 600,
                            letterSpacing: '0.12em', color: '#a78bfa', marginBottom: 16 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                            CAMPUSRIDE
                        </div>
                        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#fff',
                            letterSpacing: '-1.2px', margin: 0, lineHeight: 1.2 }}>
                            My <span style={{ color: '#a78bfa' }}>Bookings</span>
                        </h1>
                    </div>

                    {bookings.length === 0 ? (
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 20, padding: '48px 32px', textAlign: 'center', color: '#52525b', fontSize: 14 }}>
                            No bookings yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {bookings.map((b) => {
                                const payment = payments[b.BookingID];
                                const isPaid = payment !== null && payment !== undefined;
                                const isUnpaid = payment === null && b.BookingStatus === 'Confirmed';

                                return (
                                    <div key={b.BookingID} className="booking-card"
                                        style={{ background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            backdropFilter: 'blur(16px)', borderRadius: 20,
                                            padding: '24px 28px', display: 'flex',
                                            flexDirection: 'column', gap: 14 }}>

                                        {/* Row 1: Route + Status badges */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                            <div>
                                                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ede9fe',
                                                    margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                                                    {b.Source} → {b.Destination}
                                                </h3>
                                                <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>
                                                    {new Date(b.BookingTime).toLocaleString()}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                                                    padding: '4px 12px', borderRadius: 999,
                                                    background: 'rgba(139,92,246,0.12)',
                                                    border: `1px solid rgba(139,92,246,0.25)`,
                                                    color: statusColor(b.BookingStatus) }}>
                                                    {b.BookingStatus.toUpperCase()}
                                                </span>

                                                {b.BookingStatus !== 'Cancelled' && (
                                                    isPaid ? (
                                                        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999,
                                                            background: 'rgba(52,211,153,0.1)', color: '#34d399',
                                                            border: '1px solid rgba(52,211,153,0.2)', fontWeight: 500 }}>
                                                            ✓ Paid via {payment.PaymentMethod}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999,
                                                            background: 'rgba(248,113,113,0.1)', color: '#f87171',
                                                            border: '1px solid rgba(248,113,113,0.2)', fontWeight: 500 }}>
                                                            ● Payment pending
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 2: Booking details */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
                                            {[
                                                ['Driver', b.DriverName],
                                                ['Seats', b.SeatsBooked],
                                                ['Fare', `Rs. ${b.TotalFare}`],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <span style={{ fontSize: 11, color: '#52525b', letterSpacing: '0.05em' }}>{label}</span>
                                                    <div style={{ fontSize: 13, color: '#d4d4d8', fontWeight: 500, marginTop: 2 }}>{value}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Row 3: Payment details block (if paid) */}
                                        {isPaid && (
                                            <div style={{ background: 'rgba(52,211,153,0.04)',
                                                border: '1px solid rgba(52,211,153,0.12)',
                                                borderRadius: 12, padding: '12px 16px',
                                                display: 'flex', flexWrap: 'wrap', gap: '6px 28px' }}>
                                                <div>
                                                    <span style={{ fontSize: 10, color: '#52525b' }}>Payment method</span>
                                                    <div style={{ fontSize: 12, color: '#34d399', fontWeight: 500, marginTop: 2 }}>
                                                        {payment.PaymentMethod}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: 10, color: '#52525b' }}>Transaction ID</span>
                                                    <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 500, marginTop: 2, fontFamily: 'monospace' }}>
                                                        {payment.TransactionID}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: 10, color: '#52525b' }}>Paid on</span>
                                                    <div style={{ fontSize: 12, color: '#d4d4d8', fontWeight: 500, marginTop: 2 }}>
                                                        {new Date(payment.Timestamp).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Row 4: Unpaid warning + Pay Now */}
                                        {isUnpaid && (
                                            <div style={{ background: 'rgba(248,113,113,0.04)',
                                                border: '1px solid rgba(248,113,113,0.15)',
                                                borderRadius: 12, padding: '12px 16px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <p style={{ fontSize: 12, color: '#f87171', margin: 0, fontWeight: 500 }}>
                                                        Payment not completed
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#52525b', margin: '2px 0 0' }}>
                                                        Your seat is reserved. Complete payment to confirm.
                                                    </p>
                                                </div>
                                                <button className="paynow-btn"
                                                    onClick={() => navigate('/payment', {
                                                        state: {
                                                            bookingId: b.BookingID,
                                                            totalFare: b.TotalFare,
                                                            source: b.Source,
                                                            destination: b.Destination
                                                        }
                                                    })}
                                                    style={{ padding: '8px 18px', borderRadius: 10, whiteSpace: 'nowrap',
                                                        background: 'rgba(167,139,250,0.15)',
                                                        border: '1px solid rgba(167,139,250,0.3)',
                                                        color: '#a78bfa', fontSize: 12, fontWeight: 600,
                                                        cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                                                    Pay Now
                                                </button>
                                            </div>
                                        )}

                                        {/* Row 5: Cancel button */}
                                        {b.BookingStatus === 'Confirmed' && b.RideStatus === 'Active' && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button className="cancel-btn"
                                                    onClick={() => handleCancel(b.BookingID)}
                                                    style={{ padding: '8px 18px', borderRadius: 10,
                                                        background: 'rgba(239,68,68,0.1)',
                                                        border: '1px solid rgba(239,68,68,0.3)',
                                                        color: '#f87171', fontSize: 12, fontWeight: 500,
                                                        cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                                                    Cancel booking
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyBookings;