import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import BookingModal from '../components/BookingModal';

function RideDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const fetchRideDetails = async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/rides/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                
                if (data.success) {
                    setRide(data.data);
                } else {
                    setError(data.message || data.error || 'Failed to fetch ride details');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRideDetails();
    }, [id, token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0e0c15] text-white">
                <Navbar />
                <div className="flex justify-center items-center h-64">
                    <div className="text-purple-400">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0e0c15] text-white">
                <Navbar />
                <div className="flex justify-center items-center h-64">
                    <div className="text-red-400">{error}</div>
                </div>
            </div>
        );
    }

    if (!ride) return null;

    return (
        <div className="min-h-screen bg-[#0e0c15] text-white relative overflow-x-hidden pb-20" style={{ fontFamily: "'Sora', sans-serif" }}>
            <Navbar />
            
            <div className="absolute top-40 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[800px] mx-auto px-6 pt-12 relative z-10">
                <button 
                    onClick={() => navigate('/rides')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Search
                </button>

                <div className="flex flex-col items-center mb-10">
                    <div className="px-3 py-1 mb-4 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40">
                        CAMPUSRIDE
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
                        Ride <span className="text-[#a78bfa]">Details</span>
                    </h1>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Source</div>
                            <div className="text-base text-white">{ride.Source}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Destination</div>
                            <div className="text-base text-white">{ride.Destination}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Departure Time</div>
                            <div className="text-base text-white">
                                {new Date(ride.DepartureTime).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Price Per Seat</div>
                            <div className="text-base text-[#a78bfa] font-semibold">Rs. {ride.PricePerSeat}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Driver</div>
                            <div className="text-base text-white">{ride.DriverName} (★ {ride.DriverRating || 'N/A'})</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Vehicle</div>
                            <div className="text-base text-white">{ride.VehicleMake} {ride.VehicleModel} · {ride.VehicleColor}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Available Seats</div>
                            <div className={`text-base ${ride.AvailableSeats === 0 ? 'text-[#f87171]' : 'text-white'}`}>
                                {ride.AvailableSeats}
                            </div>
                        </div>
                    </div>

                    {ride.waypoints && ride.waypoints.length > 0 && (
                        <div className="mb-8 border-t border-white/10 pt-6">
                            <h3 className="text-sm font-semibold text-[#a78bfa] mb-4">Route Stops</h3>
                            <ul className="space-y-3">
                                {ride.waypoints.map((wp, index) => (
                                    <li key={index} className="flex items-center gap-3 text-sm text-zinc-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        {wp.Location}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            console.log('Button clicked, opening modal');
                            setModalOpen(true);
                        }}
                        disabled={ride.AvailableSeats === 0}
                        className={`w-full py-4 rounded-xl font-semibold transition-colors ${
                            ride.AvailableSeats === 0 
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                            : 'bg-purple-700 hover:bg-purple-600 text-white'
                        }`}
                    >
                        {ride.AvailableSeats === 0 ? 'No Seats Available' : 'Book This Ride'}
                    </button>
                </div>
            </div>

            {/* Booking Modal */}
            {modalOpen && (
                <BookingModal 
                    ride={ride} 
                    isOpen={modalOpen} 
                    onClose={() => setModalOpen(false)} 
                    token={token} 
                />
            )}
        </div>
    );
}

export default RideDetails;