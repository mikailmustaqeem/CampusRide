import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const CreateRide = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [formData, setFormData] = useState({
        source: '', destination: '', departureTime: '',
        availableSeats: 1, pricePerSeat: '', vehicleId: ''
    });
    const [vehicles, setVehicles] = useState([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({
        make: '', model: '', year: new Date().getFullYear(),
        color: '', licensePlate: '', capacity: 4
    });
    const [vehicleLoading, setVehicleLoading] = useState(false);
    const [vehicleError, setVehicleError] = useState('');

    const fetchVehicles = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/vehicles/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.data.length > 0) {
                setVehicles(data.data);
                setFormData(prev => ({ ...prev, vehicleId: data.data[0].VehicleID }));
                setShowAddVehicle(false);
            } else {
                setVehicles([]);
                setShowAddVehicle(true); // Auto-show form if no vehicles
            }
        } catch (e) {
            console.error(e);
        } finally {
            setVehiclesLoading(false);
        }
    };

    useEffect(() => { fetchVehicles(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleVehicleChange = (e) => setVehicleForm({ ...vehicleForm, [e.target.name]: e.target.value });

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        setVehicleLoading(true);
        setVehicleError('');
        try {
            const res = await fetch('http://localhost:5001/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(vehicleForm)
            });
            const data = await res.json();
            if (data.success) {
                await fetchVehicles(); // Reload vehicles — will auto-select new one
                setVehicleForm({ make: '', model: '', year: new Date().getFullYear(), color: '', licensePlate: '', capacity: 4 });
            } else {
                setVehicleError(data.message || 'Failed to add vehicle');
            }
        } catch (err) {
            setVehicleError('Failed to connect to server');
        } finally {
            setVehicleLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.vehicleId) { setError('Please add a vehicle first.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5001/api/rides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    source: formData.source,
                    destination: formData.destination,
                    departureTime: formData.departureTime,
                    availableSeats: parseInt(formData.availableSeats),
                    pricePerSeat: parseFloat(formData.pricePerSeat),
                    vehicleId: parseInt(formData.vehicleId)
                })
            });
            const data = await res.json();
            if (data.success) navigate('/my-rides');
            else setError(data.message || data.error || 'Failed to create ride');
        } catch (err) {
            setError('Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: 12,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'white', fontSize: 14, outline: 'none', fontFamily: "'Sora', sans-serif",
        boxSizing: 'border-box'
    };

    const labelStyle = {
        display: 'block', fontSize: 11, color: '#71717a',
        marginBottom: 6, fontWeight: 600, letterSpacing: '0.08em'
    };

    const smallInputStyle = {
        ...inputStyle, padding: '10px 14px', fontSize: 13
    };

    return (
        <div className="min-h-screen bg-[#0e0c15] text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
                .ride-input:focus { border-color: rgba(139,92,246,0.6) !important; background: rgba(139,92,246,0.05) !important; }
                .ride-input option { background: #1a1128; color: white; }
            `}</style>
            <Navbar />

            <div className="fixed top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
                 style={{ background: 'rgba(124,58,237,0.06)', filter: 'blur(80px)', transform: 'translate(30%,-30%)' }} />

            <div className="max-w-lg mx-auto px-6 pt-12 pb-20 relative z-10">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        CAMPUSRIDE
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Create a <span className="text-purple-400">Ride</span>
                    </h1>
                    <p className="text-zinc-500 text-sm">Post a ride offer for other students to book</p>
                </div>

                {/* Add Vehicle Section — shown when no vehicle exists */}
                {showAddVehicle && (
                    <div className="rounded-3xl p-6 mb-6"
                         style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-sm font-semibold text-white mb-0.5">
                                    {vehicles.length === 0 ? '🚗 Register your vehicle first' : '+ Add another vehicle'}
                                </p>
                                <p className="text-xs text-zinc-500">Required before creating a ride</p>
                            </div>
                            {vehicles.length > 0 && (
                                <button onClick={() => setShowAddVehicle(false)}
                                    style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>
                                    ✕
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleAddVehicle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={labelStyle}>MAKE</label>
                                        <input className="ride-input" style={smallInputStyle}
                                            name="make" placeholder="e.g. Toyota"
                                            value={vehicleForm.make}
                                            onChange={handleVehicleChange} required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>MODEL</label>
                                        <input className="ride-input" style={smallInputStyle}
                                            name="model" placeholder="e.g. Corolla"
                                            value={vehicleForm.model}
                                            onChange={handleVehicleChange} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={labelStyle}>COLOR</label>
                                        <input className="ride-input" style={smallInputStyle}
                                            name="color" placeholder="e.g. White"
                                            value={vehicleForm.color}
                                            onChange={handleVehicleChange} required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>YEAR</label>
                                        <input className="ride-input" style={smallInputStyle}
                                            type="number" name="year"
                                            min="2000" max="2026"
                                            value={vehicleForm.year}
                                            onChange={handleVehicleChange} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={labelStyle}>LICENSE PLATE</label>
                                        <input className="ride-input" style={smallInputStyle}
                                            name="licensePlate" placeholder="e.g. LHR-1234"
                                            value={vehicleForm.licensePlate}
                                            onChange={handleVehicleChange} required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>CAPACITY (SEATS)</label>
                                        <input className="ride-input" style={smallInputStyle}
                                            type="number" name="capacity"
                                            min="2" max="8"
                                            value={vehicleForm.capacity}
                                            onChange={handleVehicleChange} required />
                                    </div>
                                </div>

                                {vehicleError && (
                                    <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{vehicleError}</p>
                                )}

                                <button type="submit" disabled={vehicleLoading}
                                    style={{ padding: '11px', borderRadius: 12, border: 'none',
                                        background: vehicleLoading ? '#5b21b6' : '#7C3AED',
                                        color: 'white', fontSize: 13, fontWeight: 600,
                                        cursor: vehicleLoading ? 'not-allowed' : 'pointer',
                                        fontFamily: "'Sora', sans-serif" }}>
                                    {vehicleLoading ? 'Saving...' : '✓ Save Vehicle'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Ride Form */}
                <div className="rounded-3xl p-8"
                     style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            <div>
                                <label style={labelStyle}>FROM</label>
                                <input className="ride-input" style={inputStyle}
                                    type="text" name="source" placeholder="e.g. DHA Phase 5"
                                    value={formData.source} onChange={handleChange} required />
                            </div>

                            <div>
                                <label style={labelStyle}>TO</label>
                                <input className="ride-input" style={inputStyle}
                                    type="text" name="destination" placeholder="e.g. FAST NUCES"
                                    value={formData.destination} onChange={handleChange} required />
                            </div>

                            <div>
                                <label style={labelStyle}>DEPARTURE TIME</label>
                                <input className="ride-input"
                                    style={{ ...inputStyle, colorScheme: 'dark' }}
                                    type="datetime-local" name="departureTime"
                                    value={formData.departureTime} onChange={handleChange} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>AVAILABLE SEATS</label>
                                    <input className="ride-input" style={inputStyle}
                                        type="number" name="availableSeats" min="1" max="8"
                                        value={formData.availableSeats} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>PRICE PER SEAT (RS.)</label>
                                    <input className="ride-input" style={inputStyle}
                                        type="number" name="pricePerSeat" min="0" placeholder="e.g. 300"
                                        value={formData.pricePerSeat} onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Vehicle selector */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>YOUR VEHICLE</label>
                                    {vehicles.length > 0 && (
                                        <button type="button"
                                            onClick={() => setShowAddVehicle(!showAddVehicle)}
                                            style={{ background: 'none', border: 'none', color: '#a78bfa',
                                                fontSize: 11, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                                            + Add another
                                        </button>
                                    )}
                                </div>

                                {vehiclesLoading ? (
                                    <div style={{ ...inputStyle, color: '#52525b' }}>Loading vehicles...</div>
                                ) : vehicles.length > 0 ? (
                                    <select className="ride-input" style={inputStyle}
                                        name="vehicleId" value={formData.vehicleId}
                                        onChange={handleChange} required>
                                        {vehicles.map(v => (
                                            <option key={v.VehicleID} value={v.VehicleID}>
                                                {v.Make} {v.Model} · {v.Color} · {v.LicensePlate}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div style={{ ...inputStyle, color: '#f87171', fontSize: 13 }}>
                                        ⚠ Please add your vehicle above first
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div style={{ background: 'rgba(248,113,113,0.1)',
                                    border: '1px solid rgba(248,113,113,0.2)',
                                    borderRadius: 10, padding: '10px 14px' }}>
                                    <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>
                                </div>
                            )}

                            <button type="submit"
                                disabled={loading || vehicles.length === 0}
                                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                    background: (loading || vehicles.length === 0) ? '#4c1d95' : '#7C3AED',
                                    color: 'white', fontSize: 15, fontWeight: 600,
                                    cursor: (loading || vehicles.length === 0) ? 'not-allowed' : 'pointer',
                                    fontFamily: "'Sora', sans-serif",
                                    opacity: (loading || vehicles.length === 0) ? 0.6 : 1 }}>
                                {loading ? 'Creating...' : '+ Create Ride'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateRide;