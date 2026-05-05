// frontend/src/pages/Welcome.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { NoticeModal } from '../components/ThemeModals';

function Welcome() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();
    const [notice, setNotice] = useState(null);

    const onSubmit = async (data) => {
        try {
            let response = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            let result = await response.json();
            console.log(result);

            if (response.ok) {
            
                localStorage.setItem("token", result.token);
                localStorage.setItem("user", JSON.stringify(result.user));
                setNotice({
                    variant: 'success',
                    title: 'Welcome back',
                    message: 'You are signed in.',
                    navigateTo: '/dashboard',
                });
            } else {
                
                setNotice({ variant: 'error', message: result.message || 'Login failed' });
            }

        } catch (error) {
            console.error("Error", error);
            setNotice({ variant: 'error', message: 'Failed to connect to server' });
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0e0c15]">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap'); body { font-family: 'Sora', sans-serif; }`}</style>
            <NoticeModal
                open={notice != null}
                title={notice?.title}
                message={notice?.message ?? ''}
                variant={notice?.variant ?? 'info'}
                onClose={() => {
                    const to = notice?.navigateTo;
                    setNotice(null);
                    if (to) navigate(to);
                }}
            />

            {/* LEFT PANEL */}
            <div className="w-1/2 flex flex-col justify-center px-16 py-20 relative overflow-hidden">
                <div className="absolute w-96 h-96 rounded-full -top-16 -left-16 bg-purple-600 opacity-10 blur-3xl pointer-events-none" />
                <div className="absolute w-64 h-64 rounded-full bottom-10 -right-10 bg-purple-400 opacity-10 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-2 w-fit mb-9 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    CAMPUSRIDE
                </div>

                <h1 className="text-5xl font-bold leading-tight text-white mb-5" style={{ letterSpacing: '-1.5px' }}>
                    Share rides,<br />
                    <span className="text-purple-400">save money.</span>
                </h1>

                <p className="text-base font-light leading-relaxed text-zinc-500 mb-12 max-w-xs">
                    Connect with fellow students for safe, affordable daily commutes.
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

                {/* Glass card */}
                <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10 w-96">
                    <h2 className="text-2xl font-semibold text-white mb-1">Welcome back</h2>
                    <p className="text-sm font-light text-zinc-500 mb-8">Sign in to your CampusRide account</p>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Email */}
                        <div className="mb-4">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                    <Mail size={15} />
                                </span>
                                <input
                                    placeholder="Email address"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-purple-100 text-sm placeholder-zinc-600 outline-none focus:border-purple-600/60 focus:bg-purple-900/10 transition-colors"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: { value: /@/, message: "Enter a valid email" }
                                    })}
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-1.5 pl-1">* {errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                    <Lock size={15} />
                                </span>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-purple-100 text-sm placeholder-zinc-600 outline-none focus:border-purple-600/60 focus:bg-purple-900/10 transition-colors"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: { value: 6, message: "Minimum 6 characters" }
                                    })}
                                />
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1.5 pl-1">* {errors.password.message}</p>}
                        </div>

                        {/* Forgot */}
                        <div className="text-right mb-6">
                            <Link to="/forgot" className="text-purple-500 text-xs hover:text-purple-400 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                            {!isSubmitting && <ArrowRight size={15} />}
                        </button>

                        {/* Sign up */}
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

export default Welcome;