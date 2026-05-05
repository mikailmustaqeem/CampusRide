import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RideCard from '../components/RideCard';

function RideSearch() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRides = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (source) params.append('source', source);
            if (destination) params.append('destination', destination);
            if (date) params.append('date', date);

            const url = `http://localhost:5001/api/rides${params.toString() ? '?' + params.toString() : ''}`;
            
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            
            if (data.success) {
                const list = Array.isArray(data.data) ? data.data : [];
                setRides([...list].sort((a, b) => Number(b.RideID ?? 0) - Number(a.RideID ?? 0)));
            } else {
                setError(data.message || data.error || 'Failed to fetch rides');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRides();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchRides();
    };

    return (
        <div className="min-h-screen bg-[#0e0c15] text-white relative overflow-x-hidden pb-20" style={{ fontFamily: "'Sora', sans-serif" }}>
            <Navbar />
            
            {/* Background glow blobs */}
            <div className="absolute top-40 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-40 right-20 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[800px] mx-auto px-6 pt-12 relative z-10">
                <div className="flex flex-col items-center mb-12">
                    <div className="px-3 py-1 mb-4 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40">
                        CAMPUSRIDE
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
                        Find a <span className="text-[#a78bfa]">Ride</span>
                    </h1>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-10">
                    <input
                        type="text"
                        placeholder="Source"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 text-purple-100 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-600/60 transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 text-purple-100 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-600/60 transition-colors"
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 text-purple-100 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-600/60 transition-colors"
                    />
                    <button
                        type="submit"
                        className="bg-purple-700 hover:bg-purple-600 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
                    >
                        Search
                    </button>
                </form>

                {loading ? (
                    <div className="text-center text-purple-400 py-10">Loading...</div>
                ) : error ? (
                    <div className="text-center text-red-400 py-10">{error}</div>
                ) : rides.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10 text-center text-zinc-400">
                        No rides found.
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {rides.map(r => (
                            <RideCard key={r.RideID} ride={r} onClick={() => navigate(`/rides/${r.RideID}`)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RideSearch;
