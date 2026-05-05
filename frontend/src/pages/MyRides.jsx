import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ConfirmModal, NoticeModal } from '../components/ThemeModals';

function MyRides() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteRideId, setDeleteRideId] = useState(null);
    const [completeRideId, setCompleteRideId] = useState(null);
    const [notice, setNotice] = useState(null);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const fetchRides = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/rides/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const list = Array.isArray(data.data) ? data.data : [];
                setRides([...list].sort((a, b) => Number(b.RideID ?? 0) - Number(a.RideID ?? 0)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRides(); }, []);

    const handleDelete = (rideId) => setDeleteRideId(rideId);

    const confirmDeleteRide = async () => {
        const rideId = deleteRideId;
        setDeleteRideId(null);
        if (rideId == null) return;
        try {
            const res = await fetch(`http://localhost:5001/api/rides/${rideId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRides();
                setNotice({ variant: 'success', title: 'Ride removed', message: 'The ride has been deleted.' });
            } else {
                const data = await res.json();
                setNotice({ variant: 'error', message: data.message || 'Failed to delete' });
            }
        } catch (e) {
            console.error(e);
            setNotice({ variant: 'error', message: 'Could not delete ride. Try again.' });
        }
    };

    const handleComplete = (rideId) => setCompleteRideId(rideId);

    const confirmCompleteRide = async () => {
        const rideId = completeRideId;
        setCompleteRideId(null);
        if (rideId == null) return;
        try {
            const res = await fetch(`http://localhost:5001/api/rides/${rideId}/complete`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNotice({
                    variant: 'success',
                    title: 'Ride completed',
                    message: `${data.notificationsSent ?? 0} passenger(s) were notified to leave reviews.`,
                });
                fetchRides();
            } else {
                setNotice({ variant: 'error', message: data.message || 'Failed to complete ride' });
            }
        } catch (e) {
            console.error(e);
            setNotice({ variant: 'error', message: 'Failed to connect to server' });
        }
    };
    const statusColor = (status) => {
        if (status === 'Active') return { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' };
        if (status === 'Full') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' };
        if (status === 'Cancelled') return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' };
        if (status === 'Completed') return { color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' };
        return { color: '#a1a1aa', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0e0c15', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#a78bfa',
            fontFamily: "'Sora', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');`}</style>
            Loading...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0e0c15] text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
                .ride-card { transition: border-color 0.2s; }
                .ride-card:hover { border-color: rgba(139,92,246,0.4) !important; }
                .del-btn:hover { background: rgba(239,68,68,0.2) !important; }
                .edit-btn:hover { background: rgba(139,92,246,0.25) !important; }
            `}</style>
            <Navbar />

            <ConfirmModal
                open={deleteRideId != null}
                title="Delete this ride?"
                message="Are you sure you want to delete this ride? Passengers with bookings may be affected."
                confirmText="Delete"
                cancelText="Cancel"
                danger
                onConfirm={confirmDeleteRide}
                onCancel={() => setDeleteRideId(null)}
            />
            <ConfirmModal
                open={completeRideId != null}
                title="Mark ride completed?"
                message="Passengers will be notified to leave reviews."
                confirmText="Mark completed"
                cancelText="Cancel"
                onConfirm={confirmCompleteRide}
                onCancel={() => setCompleteRideId(null)}
            />
            <NoticeModal
                open={notice != null}
                title={notice?.title}
                message={notice?.message ?? ''}
                variant={notice?.variant ?? 'info'}
                onClose={() => setNotice(null)}
            />

            <div className="fixed top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
                 style={{ background: 'rgba(124,58,237,0.06)', filter: 'blur(80px)', transform: 'translate(30%,-30%)' }} />
            <div className="fixed bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
                 style={{ background: 'rgba(167,139,250,0.05)', filter: 'blur(80px)', transform: 'translate(-30%,30%)' }} />

            <div className="max-w-3xl mx-auto px-6 pt-12 pb-20 relative z-10">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '4px 14px', borderRadius: 999, background: 'rgba(109,40,217,0.15)',
                            border: '1px solid rgba(139,92,246,0.3)', fontSize: 11, fontWeight: 600,
                            letterSpacing: '0.12em', color: '#a78bfa', marginBottom: 16 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                            CAMPUSRIDE
                        </div>
                        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#fff',
                            letterSpacing: '-1.2px', margin: 0, lineHeight: 1.2 }}>
                            My <span style={{ color: '#a78bfa' }}>Rides</span>
                        </h1>
                        <p style={{ color: '#52525b', fontSize: 13, marginTop: 6 }}>
                            {rides.length} ride{rides.length !== 1 ? 's' : ''} posted
                        </p>
                    </div>
                    <button onClick={() => navigate('/create-ride')}
                        style={{ padding: '12px 20px', borderRadius: 14, border: 'none',
                            background: '#7C3AED', color: 'white', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                        + Create New Ride
                    </button>
                </div>

                {/* Empty state */}
                {rides.length === 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 20, padding: '64px 32px', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>🚗</div>
                        <p style={{ color: '#71717a', fontSize: 14, marginBottom: 8 }}>No rides posted yet</p>
                        <p style={{ color: '#52525b', fontSize: 12, marginBottom: 24 }}>
                            Create your first ride and help students commute
                        </p>
                        <button onClick={() => navigate('/create-ride')}
                            style={{ padding: '12px 24px', borderRadius: 12, border: 'none',
                                background: '#7C3AED', color: 'white', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                            + Create Ride
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {rides.map(r => {
                            const sc = statusColor(r.Status);
                            return (
                                <div key={r.RideID} className="ride-card"
                                     style={{ background: 'rgba(255,255,255,0.04)',
                                         border: '1px solid rgba(255,255,255,0.08)',
                                         borderRadius: 20, padding: '24px 28px' }}>

                                    {/* Top row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div>
                                            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#ede9fe',
                                                margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                                                {r.Source} → {r.Destination}
                                            </h3>
                                            <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>
                                                {new Date(r.DepartureTime).toLocaleString('en-PK', {
                                                    dateStyle: 'medium', timeStyle: 'short'
                                                })}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                                            padding: '4px 12px', borderRadius: 999,
                                            background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                                            {r.Status.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px', marginBottom: 16 }}>
                                        {[
                                            ['Seats Left', r.AvailableSeats],
                                            ['Bookings', r.BookingsCount || 0],
                                            ['Price', `Rs. ${r.PricePerSeat}/seat`],
                                            ['Vehicle', r.VehicleMake
                                                ? `${r.VehicleMake} ${r.VehicleModel} · ${r.VehicleColor}`
                                                : 'N/A'],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <span style={{ fontSize: 11, color: '#52525b', letterSpacing: '0.05em' }}>
                                                    {label}
                                                </span>
                                                <div style={{ fontSize: 13, color: '#d4d4d8', fontWeight: 500, marginTop: 2 }}>
                                                    {value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action buttons */}
                                   {/* Action buttons */}
<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
    {r.Status === 'Active' && (
        <button className="edit-btn"
            onClick={() => navigate(`/edit-ride/${r.RideID}`)}
            style={{ padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.25)',
                color: '#a78bfa', fontSize: 12, fontWeight: 500,
                fontFamily: "'Sora', sans-serif" }}>
            Edit
        </button>
    )}
    
    {/* NEW "Mark Completed" button - only shows for Active rides that have already passed */}
   {/* Mark Completed button - only for Active rides with bookings AND time has passed */}
{r.Status === 'Active' && r.BookingsCount > 0  && (
        <button 
            onClick={() => handleComplete(r.RideID)}
            style={{ padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399', fontSize: 12, fontWeight: 500,
                fontFamily: "'Sora', sans-serif" }}>
            ✓ Mark Completed
        </button>
    )}
    
    <button className="del-btn"
        onClick={() => handleDelete(r.RideID)}
        style={{ padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', fontSize: 12, fontWeight: 500,
            fontFamily: "'Sora', sans-serif" }}>
        Delete
    </button>
</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyRides;