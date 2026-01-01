import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, ArrowRight, User, MapPin, Search, X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
    const [step, setStep] = useState(1); // 1: Input, 2: OTP Verify, 3: Registration
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    // Reg Fields
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [phone, setPhone] = useState('');
    const [pincode, setPincode] = useState('');
    const [address, setAddress] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Guest Track State
    const [trackId, setTrackId] = useState('');
    const [trackResult, setTrackResult] = useState(null);
    const [trackLoading, setTrackLoading] = useState(false);
    const [trackError, setTrackError] = useState('');

    const navigate = useNavigate();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (loginMethod === 'otp') {
                if (step === 1) {
                    await axios.post('http://localhost:5000/api/auth/send-otp', { email });
                    setStep(2);
                } else if (step === 2) {
                    const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
                    if (res.data.isNewUser) {
                        setStep(3); // Go to Reg
                    } else {
                        completeLogin(res.data.user);
                    }
                }
            } else {
                // Password Login
                const res = await axios.post('http://localhost:5000/api/auth/login-password', { email, password });
                completeLogin(res.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
        setLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/update-profile', {
                email, name, city, phone, pincode, address, password: newPassword
            });
            completeLogin(res.data.user);
        } catch (err) {
            setError('Registration failed.');
        }
        setLoading(false);
    };

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!trackId) return;
        setTrackLoading(true);
        setTrackError('');
        setTrackResult(null);
        try {
            const res = await axios.get(`http://localhost:5000/api/complaint/${trackId}/status`);
            setTrackResult(res.data);
        } catch (err) {
            setTrackError('Ticket not found. Please check the ID.');
        }
        setTrackLoading(false);
    };

    const completeLogin = (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/user/dashboard');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'In Progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-10"></div>

            <div className="flex flex-col gap-6 w-full max-w-md relative z-10">

                {/* LOGIN CARD */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-center">
                        <Shield className="h-12 w-12 text-white mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-white">SmartPost AI</h1>
                        <p className="text-red-100 text-sm">Citizen Grievance Portal</p>
                    </div>

                    <div className="p-8">
                        {step < 3 && (
                            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                                <button
                                    onClick={() => { setLoginMethod('otp'); setStep(1); setError(''); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${loginMethod === 'otp' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    OTP Login
                                </button>
                                <button
                                    onClick={() => { setLoginMethod('password'); setStep(1); setError(''); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${loginMethod === 'password' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Password
                                </button>
                            </div>
                        )}

                        {step < 3 ? (
                            <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            disabled={step === 2}
                                        />
                                    </div>
                                </div>

                                {loginMethod === 'password' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input
                                                type="password"
                                                required
                                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {loginMethod === 'otp' && step === 2 && (
                                    <div className="animate-fade-in-up">
                                        <label className="block text-sm font-medium text-gray-700 mb-1 text-center">One-Time Password</label>
                                        <input
                                            type="text" required maxLength="4" autoFocus
                                            className="w-full text-center text-3xl tracking-widest py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono mb-2"
                                            value={otp}
                                            placeholder="XXXX"
                                            onChange={e => setOtp(e.target.value)}
                                        />
                                        <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs text-red-600 hover:underline">Change Email or Resend</button>
                                    </div>
                                )}

                                {error && <p className="text-red-500 text-xs text-center font-medium bg-red-50 p-2 rounded">{error}</p>}

                                <button disabled={loading} className="w-full bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition flex justify-center items-center gap-2 shadow-lg shadow-red-200">
                                    {loading ? 'Processing...' : (loginMethod === 'otp' && step === 1 ? 'Get Verification Code' : 'Secure Login')}
                                    {!loading && <ArrowRight className="h-4 w-4" />}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in-up">
                                <div className="text-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Complete Profile</h2>
                                    <p className="text-xs text-gray-500">Please provide details for postal verification.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                        <input type="text" required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                                        <input type="tel" required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="+91 98765..." value={phone} onChange={e => setPhone(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                                    <input type="text" required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="House No, Street Area" value={address} onChange={e => setAddress(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                        <input type="text" required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Mumbai" value={city} onChange={e => setCity(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pincode</label>
                                        <input type="text" required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="400001" value={pincode} onChange={e => setPincode(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Set Password</label>
                                    <input type="password" required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Create a secure password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                </div>

                                <button disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition mt-2 shadow-lg">
                                    {loading ? 'Registering...' : 'Create Account'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* GUEST TRACKING CARD */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-xl">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Search className="h-5 w-5 text-yellow-300" /> Track Request
                    </h3>
                    <form onSubmit={handleTrack} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter Ticket ID (e.g. 176608...)"
                            className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:bg-white/30"
                            value={trackId}
                            onChange={e => setTrackId(e.target.value)}
                        />
                        <button disabled={trackLoading} className="bg-yellow-400 text-red-900 font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition disabled:opacity-50">
                            {trackLoading ? '...' : 'Track'}
                        </button>
                    </form>
                    {trackError && <p className="text-red-300 text-xs mt-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {trackError}</p>}
                </div>
            </div>

            {/* TRACKING RESULT MODAL */}
            {trackResult && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Ticket Status</h3>
                                <p className="text-xs text-gray-500 font-mono">#{trackResult.id}</p>
                            </div>
                            <button onClick={() => setTrackResult(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`px-4 py-2 rounded-lg border font-bold text-sm ${getStatusColor(trackResult.status)}`}>
                                    {trackResult.status}
                                </div>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="h-4 w-4" /> {new Date(trackResult.timestamp).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Issue Category</label>
                                    <p className="font-medium text-gray-800">{trackResult.category}</p>
                                </div>

                                {trackResult.finalResponse ? (
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> Resolution
                                        </label>
                                        <p className="text-emerald-900 text-sm italic">"{trackResult.finalResponse}"</p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Current Status</label>
                                        <p className="text-blue-900 text-sm">Your request is currently being processed by our officers.</p>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setTrackResult(null)} className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 text-center w-full text-white/20 text-xs z-0 pointer-events-none">
                &copy; 2024 SmartPost India. Secure Government Portal.
            </div>
        </div>
    );
};

export default Login;
