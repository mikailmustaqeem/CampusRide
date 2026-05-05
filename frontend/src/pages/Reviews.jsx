import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const stars = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

function Reviews() {
    const [tab, setTab] = useState('give');
    const [myReviews, setMyReviews] = useState({ given: [], received: [], avgRating: 0 });
    const [reviewable, setReviewable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [submitError, setSubmitError] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [myRes, bookRes] = await Promise.all([
                fetch('http://localhost:5001/api/reviews/my', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5001/api/reviews/bookings', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const myData = await myRes.json();
            const bookData = await bookRes.json();
            if (myData.success) setMyReviews(myData);
            if (bookData.success) setReviewable(bookData.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSubmit = async () => {
        if (!selected) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch('http://localhost:5001/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ revieweeId: selected.DriverID, rideId: selected.RideID, rating, comment })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Review submitted!');
                setSelected(null); setComment(''); setRating(5);
                fetchAll();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setSubmitError(data.message || 'Could not submit review.');
            }
        } catch (e) { console.error(e); setSubmitError('Failed to connect to server.'); }
        finally { setSubmitting(false); }
    };

    const tabStyle = (t) => ({
        padding: '8px 20px', borderRadius: 999, fontSize: 13, fontWeight: 500,
        cursor: 'pointer', border: 'none', transition: 'all 0.15s',
        background: tab === t ? '#7C3AED' : 'rgba(255,255,255,0.05)',
        color: tab === t ? 'white' : '#71717a',
        fontFamily: "'Sora', sans-serif"
    });

    return (
        <div className="min-h-screen bg-[#0e0c15] text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');`}</style>
            <Navbar />

            <div className="max-w-2xl mx-auto px-6 pt-12 pb-20">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        CAMPUSRIDE
                    </div>
                    <div className="flex items-end gap-4 mb-1">
                        <h1 className="text-4xl font-bold">
                            My <span className="text-purple-400">Reviews</span>
                        </h1>
                        {myReviews.avgRating > 0 && (
                            <div className="mb-1 px-3 py-1 rounded-full text-sm font-semibold"
                                 style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                                ★ {parseFloat(myReviews.avgRating).toFixed(1)} avg
                            </div>
                        )}
                    </div>
                    <p className="text-zinc-500 text-sm">Rate your drivers and see feedback you've received</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button style={tabStyle('give')} onClick={() => { setTab('give'); setSubmitError(''); }}>
                        Rate a Driver {reviewable.length > 0 && `(${reviewable.length})`}
                    </button>
                    <button style={tabStyle('given')} onClick={() => { setTab('given'); setSubmitError(''); }}>
                        Reviews Given
                    </button>
                    <button style={tabStyle('received')} onClick={() => { setTab('received'); setSubmitError(''); }}>
                        Reviews Received
                    </button>
                </div>

                {success && (
                    <div className="mb-4 p-4 rounded-2xl text-sm"
                         style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                        ✅ {success}
                    </div>
                )}
                {submitError && (
                    <div className="mb-4 p-4 rounded-2xl text-sm"
                         style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                        {submitError}
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-zinc-500 py-12">Loading...</div>
                ) : (
                    <>
                        {/* Tab: Rate a Driver */}
                        {tab === 'give' && (
                            <div className="flex flex-col gap-4">
                                {reviewable.length === 0 ? (
                                    <div className="rounded-2xl p-8 text-center text-zinc-500 text-sm"
                                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        No rides to review yet. Pay for your booking first; after your driver marks the ride completed you can rate them here.
                                    </div>
                                ) : (
                                    reviewable.map(b => (
                                        <div key={b.BookingID}
                                             className="rounded-2xl p-5"
                                             style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${selected?.BookingID === b.BookingID ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}` }}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold text-white text-sm">{b.Source} → {b.Destination}</p>
                                                    <p className="text-zinc-500 text-xs mt-0.5">Driver: {b.DriverName}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSelected(selected?.BookingID === b.BookingID ? null : b)}
                                                    className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                                                    style={{
                                                        background: selected?.BookingID === b.BookingID ? '#7C3AED' : 'rgba(139,92,246,0.15)',
                                                        border: '1px solid rgba(139,92,246,0.3)',
                                                        color: '#a78bfa', cursor: 'pointer', fontFamily: "'Sora', sans-serif"
                                                    }}>
                                                    {selected?.BookingID === b.BookingID ? 'Cancel' : 'Rate'}
                                                </button>
                                            </div>

                                            {selected?.BookingID === b.BookingID && (
                                                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {/* Star selector */}
                                                    <p className="text-xs text-zinc-400 mb-2">Your rating</p>
                                                    <div className="flex gap-2 mb-4">
                                                        {[1,2,3,4,5].map(s => (
                                                            <button key={s} onClick={() => setRating(s)}
                                                                className="text-2xl transition-transform hover:scale-110"
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer',
                                                                    color: s <= rating ? '#fbbf24' : '#3f3f46' }}>
                                                                ★
                                                            </button>
                                                        ))}
                                                        <span className="text-sm text-zinc-400 self-center ml-1">{rating}/5</span>
                                                    </div>

                                                    <textarea
                                                        placeholder="Write a comment (optional)..."
                                                        value={comment}
                                                        onChange={e => setComment(e.target.value)}
                                                        rows={3}
                                                        className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none mb-3"
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Sora', sans-serif" }}
                                                    />

                                                    <button onClick={handleSubmit} disabled={submitting}
                                                        className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
                                                        style={{ background: '#7C3AED', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'Sora', sans-serif" }}>
                                                        {submitting ? 'Submitting...' : 'Submit Review'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Tab: Reviews Given */}
                        {tab === 'given' && (
                            <div className="flex flex-col gap-3">
                                {myReviews.given.length === 0 ? (
                                    <div className="rounded-2xl p-8 text-center text-zinc-500 text-sm"
                                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        You haven't reviewed anyone yet.
                                    </div>
                                ) : myReviews.given.map(r => (
                                    <div key={r.ReviewID} className="rounded-2xl p-5"
                                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{r.RevieweeName}</p>
                                                <p className="text-xs text-zinc-500">{r.Source} → {r.Destination}</p>
                                            </div>
                                            <span style={{ color: '#fbbf24', fontSize: 16 }}>{stars(r.Rating)}</span>
                                        </div>
                                        {r.Comment && <p className="text-sm text-zinc-400 mt-2">"{r.Comment}"</p>}
                                        <p className="text-xs text-zinc-600 mt-2">{new Date(r.Timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tab: Reviews Received */}
                        {tab === 'received' && (
                            <div className="flex flex-col gap-3">
                                {myReviews.received.length === 0 ? (
                                    <div className="rounded-2xl p-8 text-center text-zinc-500 text-sm"
                                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        No reviews received yet.
                                    </div>
                                ) : myReviews.received.map(r => (
                                    <div key={r.ReviewID} className="rounded-2xl p-5"
                                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{r.ReviewerName}</p>
                                                <p className="text-xs text-zinc-500">{r.Source} → {r.Destination}</p>
                                            </div>
                                            <span style={{ color: '#fbbf24', fontSize: 16 }}>{stars(r.Rating)}</span>
                                        </div>
                                        {r.Comment && <p className="text-sm text-zinc-400 mt-2">"{r.Comment}"</p>}
                                        <p className="text-xs text-zinc-600 mt-2">{new Date(r.Timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Reviews;