import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { NOTIFICATIONS_CHANGED_EVENT } from '../constants/events';

const font = "'Sora', system-ui, sans-serif";
const DISMISS_KEY = 'campusride_review_prompt_dismissed';

function loadDismissedRideIds() {
    try {
        const raw = sessionStorage.getItem(DISMISS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
        return [];
    }
}

function dismissRideForSession(rideId) {
    const ids = loadDismissedRideIds();
    const n = Number(rideId);
    if (!ids.includes(n)) {
        ids.push(n);
        sessionStorage.setItem(DISMISS_KEY, JSON.stringify(ids));
    }
}

/**
 * Shows a review modal for passengers when they have a completed ride without a review yet.
 * Refetches on navigation, window focus, notification updates, and a light poll so completion on another device still surfaces.
 */
export function ReviewPromptHost() {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    })();

    const role = (user.role || '').toLowerCase();
    const canReceivePassengerReviewPrompt = role === 'passenger' || role === 'both';

    const [candidate, setCandidate] = useState(null);
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const pickNext = useCallback(async () => {
        if (!token || !canReceivePassengerReviewPrompt) {
            setCandidate(null);
            setOpen(false);
            return;
        }
        if (location.pathname === '/reviews') {
            setCandidate(null);
            setOpen(false);
            return;
        }
        if (location.pathname === '/payment') {
            setCandidate(null);
            setOpen(false);
            return;
        }
        try {
            const res = await fetch('http://localhost:5001/api/reviews/bookings', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
                setCandidate(null);
                setOpen(false);
                return;
            }
            const dismissed = new Set(loadDismissedRideIds());
            const next = data.data.find((b) => {
                const st = String(b.RideStatus ?? '').trim();
                return st === 'Completed' && !dismissed.has(Number(b.RideID));
            });
            if (next) {
                setCandidate(next);
                setOpen(true);
                setError('');
            } else {
                setCandidate(null);
                setOpen(false);
            }
        } catch {
            /* ignore */
        }
    }, [token, canReceivePassengerReviewPrompt, location.pathname]);

    useEffect(() => {
        pickNext();
    }, [pickNext]);

    useEffect(() => {
        if (!token || !canReceivePassengerReviewPrompt) return;

        const onFocus = () => pickNext();
        const onNotif = () => pickNext();
        window.addEventListener('focus', onFocus);
        window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onNotif);
        const id = window.setInterval(pickNext, 25000);
        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onNotif);
            window.clearInterval(id);
        };
    }, [token, canReceivePassengerReviewPrompt, pickNext]);

    const handleLater = () => {
        if (candidate?.RideID != null) dismissRideForSession(candidate.RideID);
        setOpen(false);
        setCandidate(null);
    };

    const handleSubmit = async () => {
        if (!candidate) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5001/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    revieweeId: candidate.DriverID,
                    rideId: candidate.RideID,
                    rating,
                    comment,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (data.success) {
                window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
                setOpen(false);
                setCandidate(null);
                setComment('');
                setRating(5);
                pickNext();
            } else {
                setError(data.message || 'Could not submit review.');
            }
        } catch {
            setError('Failed to connect to server.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!token || !canReceivePassengerReviewPrompt || !open || !candidate) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                background: 'rgba(10, 8, 18, 0.78)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
            }}
            role="presentation"
            onClick={(e) => e.target === e.currentTarget && handleLater()}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 420,
                    background: 'linear-gradient(145deg, rgba(30, 24, 45, 0.98) 0%, rgba(17, 13, 30, 0.99) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: 20,
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
                    padding: '28px 26px 22px',
                    fontFamily: font,
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-prompt-title"
            >
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 12px',
                        borderRadius: 999,
                        background: 'rgba(109, 40, 217, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        color: '#a78bfa',
                        marginBottom: 14,
                    }}
                >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }} />
                    RIDE COMPLETE
                </div>
                <h2
                    id="review-prompt-title"
                    style={{
                        margin: '0 0 8px',
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '-0.4px',
                    }}
                >
                    How was your trip?
                </h2>
                <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.55, color: '#a1a1aa' }}>
                    <span style={{ color: '#e4e4e7' }}>{candidate.Source} → {candidate.Destination}</span>
                    <br />
                    Driver: <span style={{ color: '#d4d4d8' }}>{candidate.DriverName}</span>
                </p>

                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#a1a1aa' }}>Rating</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 26,
                                lineHeight: 1,
                                color: s <= rating ? '#fbbf24' : '#3f3f46',
                                padding: 0,
                            }}
                        >
                            ★
                        </button>
                    ))}
                    <span style={{ fontSize: 13, color: '#71717a' }}>{rating}/5</span>
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comment (optional)"
                    rows={3}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#f4f4f5',
                        fontSize: 13,
                        fontFamily: font,
                        resize: 'vertical',
                        marginBottom: 12,
                    }}
                />

                {error && (
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#f87171' }}>{error}</p>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                        type="button"
                        onClick={handleLater}
                        style={{
                            flex: 1,
                            padding: '12px 14px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.04)',
                            color: '#a1a1aa',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            fontFamily: font,
                        }}
                    >
                        Later
                    </button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmit}
                        style={{
                            flex: 1,
                            padding: '12px 14px',
                            borderRadius: 12,
                            border: 'none',
                            background: submitting ? '#6d28d9' : '#7C3AED',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            fontFamily: font,
                        }}
                    >
                        {submitting ? 'Submitting…' : 'Submit review'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
