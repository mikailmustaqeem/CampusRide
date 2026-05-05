import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { NoticeModal } from '../components/ThemeModals';

function Wallet() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0); // ← starts at 0, loads from DB
    const [addAmount, setAddAmount] = useState('');
    const [adding, setAdding] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [success, setSuccess] = useState('');
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        fetchTransactions();
        fetchBalance();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/payments/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setTransactions(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/payments/wallet', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setBalance(data.balance);
        } catch (e) { 
            console.error(e); 
        }
    };

    const handleAddMoney = async () => {
        const amount = parseInt(addAmount);
        if (!amount || amount < 100) { 
            setNotice({ variant: 'error', title: 'Invalid amount', message: 'Minimum top-up is Rs. 100' }); 
            return; 
        }
        setAdding(true);
        
        try {
            const res = await fetch('http://localhost:5001/api/payments/wallet/topup', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();
            
            if (data.success) {
                setBalance(data.newBalance);  // ← real balance from DB
                setAddAmount('');
                setShowAdd(false);
                setSuccess(`Rs. ${amount} added to your wallet!`);
                setTimeout(() => setSuccess(''), 3000);
                fetchTransactions(); // refresh history
            } else {
                setNotice({ variant: 'error', message: data.message || 'Top-up failed' });
            }
        } catch (e) { 
            console.error(e); 
            setNotice({ variant: 'error', message: 'Failed to add money. Please try again.' });
        } finally { 
            setAdding(false); 
        }
    };

    const quickAmounts = [500, 1000, 2000, 5000];

    return (
        <div className="min-h-screen bg-[#0e0c15] text-white"
             style={{ fontFamily: "'Sora', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');`}</style>
            <Navbar />
            <NoticeModal
                open={notice != null}
                title={notice?.title}
                message={notice?.message ?? ''}
                variant={notice?.variant ?? 'info'}
                onClose={() => setNotice(null)}
            />

            <div className="max-w-2xl mx-auto px-6 pt-12 pb-20">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="px-3 py-1 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40">
                        CAMPUSRIDE
                    </div>
                </div>
                <h1 className="text-4xl font-bold mb-8">
                    My <span className="text-purple-400">Wallet</span>
                </h1>

                {/* Wallet Card */}
                <div className="rounded-3xl p-8 mb-6 relative overflow-hidden"
                     style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #6D28D9 100%)' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
                         style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
                         style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-purple-200 text-sm mb-1">Account holder</p>
                                <p className="text-white font-semibold text-lg">{user.name || 'User'}</p>
                                <p className="text-purple-200 text-sm">{user.phone || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-purple-200 text-sm mb-1">Role</p>
                                <p className="text-white font-semibold">{user.role || 'Passenger'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-purple-200 text-sm mb-1">Available balance</p>
                            <p className="text-white text-5xl font-bold">Rs. {balance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Success message */}
                {success && (
                    <div className="mb-4 p-4 rounded-2xl bg-green-900/20 border border-green-700/40 text-green-400 text-sm">
                        ✅ {success}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="py-4 rounded-2xl font-semibold text-white transition-colors"
                        style={{ background: '#7C3AED' }}>
                        + Add Money
                    </button>
                    <button
                        onClick={() => navigate('/my-bookings')}
                        className="py-4 rounded-2xl font-semibold transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                        My Bookings
                    </button>
                </div>

                {/* Add Money Panel */}
                {showAdd && (
                    <div className="rounded-2xl p-6 mb-6"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-sm font-semibold text-zinc-400 mb-4">Quick add</p>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {quickAmounts.map(amt => (
                                <button key={amt}
                                    onClick={() => setAddAmount(String(amt))}
                                    className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
                                        addAmount === String(amt)
                                            ? 'bg-purple-600 text-white'
                                            : 'text-zinc-300'
                                    }`}
                                    style={addAmount !== String(amt) ? {
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    } : {}}>
                                    {amt}
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            placeholder="Or enter custom amount"
                            value={addAmount}
                            onChange={e => setAddAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-white text-sm mb-4 outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <button
                            onClick={handleAddMoney}
                            disabled={adding}
                            className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                            style={{ background: '#7C3AED' }}>
                            {adding ? 'Processing...' : `Add Rs. ${addAmount || '0'}`}
                        </button>
                    </div>
                )}

                {/* Transaction History */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 text-zinc-300">Transaction history</h2>

                    {loading ? (
                        <p className="text-zinc-500 text-sm">Loading...</p>
                    ) : transactions.length === 0 ? (
                        <div className="rounded-2xl p-8 text-center text-zinc-500 text-sm"
                             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            No transactions yet.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {transactions.map((t, i) => (
                                <div key={t.PaymentID || i}
                                     className="rounded-2xl px-5 py-4 flex justify-between items-center"
                                     style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div>
                                        <p className="text-sm font-medium text-white">{t.PaymentMethod}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5 font-mono">{t.TransactionID}</p>
                                        <p className="text-xs text-zinc-600 mt-0.5">
                                            {new Date(t.Timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-semibold text-green-400">
                                            + Rs. {t.Amount}
                                        </p>
                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                              style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                                            {t.TransactionStatus}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Wallet;