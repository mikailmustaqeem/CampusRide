import { useState } from "react";
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            console.log('Login result:', result);

            if (response.ok && result.success) {
                // ✅ Save token and user to localStorage
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                console.log('Token saved:', localStorage.getItem('token'));
                navigate('/rides');
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0e0c15]">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap'); body { font-family: 'Sora', sans-serif; }`}</style>

            {/* LEFT PANEL */}
            <div className="w-1/2 flex flex-col justify-center px-16 py-20 relative overflow-hidden">
                <div className="absolute w-96 h-96 rounded-full -top-16 -left-16 bg-purple-600 opacity-10 blur-3xl pointer-events-none" />
                <div className="absolute w-64 h-64 rounded-full bottom-10 -right-10 bg-purple-400 opacity-10 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-2 w-fit mb-9 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    CAMPUSRIDE
                </div>

                <h1 className="text-5xl font-bold leading-tight text-white mb-5" style={{ letterSpacing: '-1.5px' }}>
                    Welcome<br />
                    <span className="text-purple-400">back.</span>
                </h1>

                <p className="text-base font-light leading-relaxed text-zinc-500 mb-12 max-w-xs">
                    Sign in to your account and continue sharing rides with your campus community.
                </p>

                <div className="flex gap-10">
                    <div>
                        <div className="text-2xl font-bold text-purple-100">500+</div>
                        <div className="text-xs tracking-wide text-zinc-500 mt-1">Active users</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-100">50+</div>
                        <div className="text-xs tracking-wide text-zinc-500 mt-1">Daily rides</div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-1/2 flex justify-center items-center p-10 relative bg-[#110d1e]">
                <div className="absolute inset-0 pointer-events-none bg-purple-900/20 blur-3xl" />

                <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10 w-96">
                    <h2 className="text-2xl font-semibold text-white mb-1">Sign in</h2>
                    <p className="text-sm font-light text-zinc-500 mb-8">Welcome back to CampusRide</p>

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="mb-4">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                    <Mail size={15} />
                                </span>
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-purple-100 text-sm placeholder-zinc-600 outline-none focus:border-purple-600/60 focus:bg-purple-900/10 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                    <Lock size={15} />
                                </span>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-purple-100 text-sm placeholder-zinc-600 outline-none focus:border-purple-600/60 focus:bg-purple-900/10 transition-colors"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-900/20 border border-red-700/40 rounded-xl">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:bg-purple-900 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                            {!loading && <ArrowRight size={15} />}
                        </button>

                        <p className="text-center mt-6 text-zinc-500 text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-purple-400 font-medium hover:text-purple-300 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;