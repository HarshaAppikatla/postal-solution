import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, MessageSquare, Clock, CheckCircle, ChevronRight, LogOut, Plus, Star, MapPin, Image, X, Mail, Building2, Phone, Settings, Camera, User, Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PackageTracker from './PackageTracker';
import UserProfile from './UserProfile';


const TicketVisualizer = ({ ticket }) => {
    // Determine active step based on status & priority
    const getStepIndex = () => {
        if (ticket.status === 'Resolved') return 3;
        if (ticket.status === 'In Progress') return 2;
        return 1; // Submitted
    };

    const currentStep = getStepIndex();
    const steps = [
        { label: 'Submitted', icon: '📝' },
        { label: 'Officer Assigned', icon: '👮' },
        { label: 'Resolved', icon: '✅' }
    ];

    return (
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8 mb-6 relative overflow-hidden">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Package className="h-5 w-5" /> Live Request Tracker
            </h3>

            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 rounded-full -translate-y-1/2"></div>

                {/* Active Progress Bar */}
                <div
                    className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-yellow-400 to-red-600 rounded-full -translate-y-1/2 transition-all duration-1000 ease-out"
                    style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>

                {/* Steps */}
                <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                        const isActive = index + 1 <= currentStep;
                        const isCurrent = index + 1 === currentStep;

                        return (
                            <div key={index} className="flex flex-col items-center group cursor-default">
                                <div
                                    className={`w-10 h-10 rounded-full border-4 flex items-center justify-center bg-white z-10 transition-all duration-500 ${isActive ? 'border-red-500 scale-110 shadow-lg' : 'border-gray-200 grayscale'}`}
                                >
                                    <span className="text-sm">{step.icon}</span>
                                </div>
                                {isCurrent && (
                                    <div className="absolute top-0 w-10 h-10 rounded-full bg-red-500/30 animate-ping -z-0"></div>
                                )}
                                <span
                                    className={`mt-3 text-xs font-bold transition-colors duration-300 ${isActive ? 'text-gray-800' : 'text-gray-400'}`}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Simulated Live Truck Animation (Only if Active) */}
            {ticket.status !== 'Resolved' && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Live</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
            )}
        </div>
    );
};

const UserDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [user, setUser] = useState(null);
    const [view, setView] = useState('list'); // list, detail, new
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [lastTicketId, setLastTicketId] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Profile Modal State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editPincode, setEditPincode] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editAvatar, setEditAvatar] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Form State
    const [loading, setLoading] = useState(false);
    const [newText, setNewText] = useState('');
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);

    const toggleListening = () => {
        if (isListening) {
            window.speechRecognition.stop();
            setIsListening(false);
        } else {
            if (!('webkitSpeechRecognition' in window)) {
                alert("Voice input is not supported in this browser. Please use Chrome/Edge.");
                return;
            }
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US'; // Default to English, but captures mixed accents well

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setNewText(prev => prev + (prev ? ' ' : '') + transcript);
            };

            window.speechRecognition = recognition;
            recognition.start();
        }
    };

    // Geo-Location State
    const [location, setLocation] = useState(null);
    const [locLoading, setLocLoading] = useState(false);
    const [nearbyOffices, setNearbyOffices] = useState([]);

    // Image Upload State
    const [image, setImage] = useState(null);
    const navigate = useNavigate();

    // Password Security State
    const [showPasswordOtp, setShowPasswordOtp] = useState(false);
    const [passwordOtp, setPasswordOtp] = useState('');
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const [securityLoading, setSecurityLoading] = useState(false);

    const handleComplaintDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to remove this resolved complaint from your history?")) return;

        try {
            await axios.post(`http://localhost:5000/api/complaint/${id}/hide`);
            fetchComplaints(user.id);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete complaint");
        }
    };

    const handleInitialPasswordClick = async () => {
        if (isPasswordVerified) return;
        setSecurityLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/send-otp', { email: user.email, purpose: 'password_change' });
            setShowPasswordOtp(true);
            alert(`OTP sent to ${user.email} for security verification.`);
        } catch (e) {
            alert("Failed to send OTP. Please try again.");
        }
        setSecurityLoading(false);
    };

    const handleVerifyPasswordOtp = async () => {
        setSecurityLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/verify-otp', { email: user.email, otp: passwordOtp });
            setIsPasswordVerified(true);
            setShowPasswordOtp(false);
            setPasswordOtp('');
            alert("Identity verified! You can now set a new password.");
        } catch (e) {
            alert("Invalid OTP. Access denied.");
        }
        setSecurityLoading(false);
    };
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Nearby Postmen State (My Beat)
    const [nearbyPostmen, setNearbyPostmen] = useState([]);
    const [showPostmanModal, setShowPostmanModal] = useState(false);
    const [postmanLoading, setPostmanLoading] = useState(false);

    const findMyPostman = async () => {
        setPostmanLoading(true);
        try {
            // Direct assignment based on User Email (Demo Magic)
            const res = await axios.get(`http://localhost:5000/api/postmen/assigned?email=${user.email}`);
            setNearbyPostmen(res.data);
            setShowPostmanModal(true);
        } catch (e) {
            console.error(e);
            alert("Failed to fetch assigned postman.");
        }
        setPostmanLoading(false);
    };

    // Haversine Formula for Distance Calculation
    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d.toFixed(1);
    };

    const generateNearbyOffices = (userLat, userLon) => {
        // Mock data logic for Hackathon Demo:
        // We generate offices slightly offset from the user's actual location
        // to guarantee they see "nearby" results during the presentation.
        const mockOffices = [
            { name: "Regional Head Post Office", lat: userLat + 0.007, lon: userLon + 0.005, type: "GPO", time: "09:00 AM - 06:00 PM", phone: "040-23456789" },
            { name: "City Sub-Post Office", lat: userLat - 0.005, lon: userLon - 0.008, type: "Sub Office", time: "09:30 AM - 05:00 PM", phone: "040-23451234" },
            { name: "Speed Post Processing Centre", lat: userLat + 0.009, lon: userLon - 0.002, type: "Speed Post Hub", time: "24 Hours", phone: "040-23450000" }
        ];

        const officesWithDist = mockOffices.map(office => ({
            ...office,
            distance: getDistanceFromLatLonInKm(userLat, userLon, office.lat, office.lon)
        })).sort((a, b) => a.distance - b.distance);

        setNearbyOffices(officesWithDist);
    };

    const detectLocation = () => {
        setLocLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                // Simulating City for demo
                const locString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)} Detected Area`;
                setLocation(locString);
                generateNearbyOffices(latitude, longitude); // Trigger nearby search
                setLocLoading(false);
            }, (error) => {
                console.error(error);
                alert("Location access denied.");
                setLocLoading(false);
            });
        } else {
            alert("Geolocation not supported.");
            setLocLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) navigate('/');
        else {
            const u = JSON.parse(storedUser);
            setUser(u);
            fetchComplaints(u.id);

            // Popluate Edit Form
            setEditName(u.name || '');
            setEditPhone(u.phone || '');
            setEditAddress(u.address || '');
            setEditCity(u.city || '');
            setEditPincode(u.pincode || '');
            setEditAvatar(u.avatar || null);
        }
    }, [navigate]);

    const fetchComplaints = async (userId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/complaints/user/${userId}`);
            setComplaints(res.data);
        } catch (e) { console.error(e); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/update-profile', {
                email: user.email,
                name: editName,
                phone: editPhone,
                address: editAddress,
                city: editCity,
                pincode: editPincode,
                password: editPassword,
                avatar: editAvatar
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setShowProfileModal(false);
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile.");
        }
        setProfileLoading(false);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/complaint', {
                text: newText,
                user: user.name,
                userId: user.id,
                email: user.email, // Send email explicitly to ensure notification reception
                location: location, // Send detected location
                image: image // Send base64 image
            });
            // Show Success Modal instead of redirecting immediately
            setLastTicketId(res.data.id);
            setShowSuccessModal(true);
            setNewText('');
            setImage(null);
            setLocation(null);
            setNearbyOffices([]); // Clear nearby offices
            fetchComplaints(user.id);
        } catch (e) {
            alert("Submission failed");
        }
        setLoading(false);
    };

    const handleRate = async () => {
        await axios.post(`http://localhost:5000/api/complaint/${selectedTicket.id}/rate`, { rating, feedback });
        alert("Thank you for your feedback!");
        setSelectedTicket(null);
        setView('list');
        fetchComplaints(user.id);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen font-sans text-slate-800 pb-20 relative bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
            {/* Animated India Post Pattern Background */}
            <div className="absolute inset-0 opacity-0"></div>

            {/* Dynamic Gradient Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-yellow-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Premium India Post Header */}
            <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white pt-6 px-6 pb-28 shadow-2xl relative overflow-hidden">
                {/* Animated Wave Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="h-full w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,50 C150,80 350,0 600,50 C850,100 1050,30 1200,50 L1200,120 L0,120 Z" fill="white" className="animate-pulse" />
                    </svg>
                </div>

                {/* Floating Envelope Icon */}
                <div className="absolute top-4 right-20 opacity-10 animate-bounce">
                    <Mail className="h-32 w-32" />
                </div>

                <div className="max-w-6xl mx-auto flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border-2 border-white/30 shadow-xl">
                            <Mail className="h-10 w-10 text-yellow-300" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                                India Post
                                <span className="text-yellow-300 text-2xl">•</span>
                                <span className="text-yellow-300 font-bold">डाक विभाग</span>
                            </h1>
                            <p className="text-yellow-200 text-sm font-semibold tracking-wide mt-1">
                                Unified Grievance Portal - भारतीय डाक शिकायत पोर्टल
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={findMyPostman}
                            disabled={postmanLoading}
                            className="bg-yellow-400 text-red-900 px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-yellow-300 transition-all flex items-center gap-2 animate-bounce-slow"
                        >
                            {postmanLoading ? <span className="animate-spin">⌛</span> : <User className="h-5 w-5" />}
                            Know Your Postman
                        </button>
                        <button
                            onClick={() => setView('profile')}
                            className="bg-white/10 backdrop-blur-md p-3 rounded-xl hover:bg-white/25 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
                            title="My Profile"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => { localStorage.removeItem('user'); navigate('/'); }}
                            className="bg-white/10 backdrop-blur-md p-3 rounded-xl hover:bg-white/25 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>



            <div className="max-w-6xl mx-auto -mt-16 px-6 relative z-20">
                {/* Navigation Tabs */}
                <div className="flex justify-center gap-4 mb-8 bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-lg inline-flex mx-auto w-full max-w-2xl">
                    <button
                        onClick={() => setView('list')}
                        className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${view === 'list' || view === 'detail' || view === 'new' ? 'bg-white text-red-600 shadow-md transform scale-105' : 'text-red-900 hover:bg-white/10'}`}
                    >
                        <MessageSquare className="h-5 w-5" /> Complaints
                    </button>
                    <button
                        onClick={() => setView('packages')}
                        className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${view === 'packages' ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-blue-900 hover:bg-white/10'}`}
                    >
                        <Package className="h-5 w-5" /> Track Parcel
                    </button>
                    <button
                        onClick={() => setView('profile')}
                        className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${view === 'profile' ? 'bg-white text-gray-800 shadow-md transform scale-105' : 'text-gray-900 hover:bg-white/10'}`}
                    >
                        <User className="h-5 w-5" /> Profile
                    </button>
                </div>

                {view === 'packages' && <PackageTracker user={user} />}
                {view === 'profile' && <UserProfile user={user} setUser={setUser} />}
                {view === 'list' && (
                    <div className="space-y-6">
                        {/* Welcome Card with India Post Theme */}
                        <div className="bg-gradient-to-r from-white to-yellow-50 p-8 rounded-3xl shadow-2xl border-2 border-yellow-200/50 flex justify-between items-center backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-30"></div>
                            <div className="relative z-10 flex items-center gap-6">
                                {user.avatar ? (
                                    <img src={user.avatar} className="w-20 h-20 rounded-full border-4 border-white shadow-xl object-cover" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center border-4 border-white shadow-xl">
                                        <User className="h-9 w-9" />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 mb-1">
                                        नमस्ते, {user.name}
                                    </h1>
                                    <p className="text-gray-600 font-medium">Track your parcels and grievances with India Post</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setView('new')}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center gap-3 transform hover:scale-105"
                            >
                                <Plus className="h-6 w-6" /> Register Complaint
                            </button>
                        </div>

                        {complaints.length === 0 ? (
                            <div className="text-center py-32 bg-white rounded-3xl border-4 border-dashed border-yellow-300 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-yellow-50/50"></div>
                                <Mail className="h-24 w-24 text-yellow-300 mx-auto mb-6 relative z-10 animate-pulse" />
                                <h3 className="text-gray-600 font-bold text-xl relative z-10">No complaints registered</h3>
                                <p className="text-gray-400 mt-2 relative z-10">Start by filing your first grievance above</p>
                            </div>
                        ) : (
                            <div className="grid gap-5">
                                {complaints.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => { setSelectedTicket(t); setView('detail'); }}
                                        className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:border-red-300 transition-all duration-300 cursor-pointer flex justify-between items-center group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 to-yellow-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                                        <div className="pl-4">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className={`text-xs font-bold px-4 py-1.5 rounded-full border-2 ${getStatusColor(t.status)}`}>
                                                    {t.status}
                                                </span>
                                                <span className="text-sm font-mono font-bold text-red-600">#{t.id}</span>
                                                <span className="text-sm text-gray-400">• {new Date(t.timestamp).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-red-600 transition-colors">{t.category}</h3>
                                            <p className="text-gray-600 mt-1 line-clamp-1">{t.text}</p>
                                        </div>
                                        <ChevronRight className="text-gray-300 group-hover:text-red-600 group-hover:translate-x-2 transition-all duration-300 h-6 w-6" />

                                        {t.status === 'Resolved' && t.rating && (
                                            <button
                                                onClick={(e) => handleComplaintDelete(e, t.id)}
                                                className="absolute top-2 right-2 p-2 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-full transition-colors z-20 shadow-md"
                                                title="Delete from history"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {view === 'new' && (
                    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-2xl border-2 border-yellow-200/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-100/30 to-yellow-100/30 rounded-full blur-3xl"></div>

                        <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-100 relative z-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-800 mb-1">File New Grievance</h2>
                                <p className="text-gray-500">शिकायत दर्ज करें</p>
                            </div>
                            <button onClick={() => setView('list')} className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-xl">
                                <X className="h-7 w-7" />
                            </button>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-900 p-5 rounded-2xl mb-8 flex items-start gap-4 border-2 border-indigo-200 relative z-10">
                            <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-lg mb-1">Multilingual Support Active</p>
                                <p className="opacity-90">Describe your issue in English, Hindi (हिंदी), or Telugu (తెలుగు). AI will detect automatically.</p>
                            </div>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-red-600" />
                                    Describe Your Issue
                                </label>
                                <div className="relative">
                                    <textarea
                                        className="w-full border-2 border-gray-200 p-5 rounded-2xl h-44 focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none transition-all shadow-sm text-gray-700 leading-relaxed hover:border-gray-300 pr-16"
                                        placeholder="Type here... or click the mic to speak (e.g., 'My parcel is delayed', 'मेरा पार्सल खो गया है')"
                                        value={newText}
                                        onChange={e => setNewText(e.target.value)}
                                    />
                                    <button
                                        onClick={toggleListening}
                                        className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isListening ? 'bg-red-600 text-white animate-pulse scale-110' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        title="Press to Speak"
                                    >
                                        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Image Upload */}
                                <div className={`border-3 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group ${image ? 'border-red-400 bg-red-50/50' : 'border-gray-300 hover:border-red-400 hover:bg-red-50/30'}`}>
                                    {image ? (
                                        <div className="relative w-full">
                                            <img src={image} alt="Preview" className="h-40 w-full object-cover rounded-xl shadow-xl mb-3 border-4 border-red-200" />
                                            <div className="flex gap-3 justify-center">
                                                <label className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition cursor-pointer text-sm">
                                                    Change Image
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                                </label>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setImage(null); }}
                                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer min-h-[200px]">
                                            <div className="bg-gradient-to-br from-red-100 to-yellow-100 p-4 rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <Image className="h-8 w-8 text-red-600" />
                                            </div>
                                            <span className="text-base font-bold text-gray-700 group-hover:text-red-600 transition-colors">Attach Evidence</span>
                                            <span className="text-xs text-gray-400 mt-2">JPG, PNG (Max 30MB)</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>

                                {/* Location */}
                                <div
                                    onClick={detectLocation}
                                    className={`border-3 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group min-h-[200px] ${location ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}`}
                                >
                                    {locLoading ? (
                                        <div className="animate-pulse flex flex-col items-center">
                                            <div className="h-12 w-12 bg-blue-200 rounded-full mb-3 animate-ping"></div>
                                            <span className="text-base font-bold text-blue-600">Detecting Location...</span>
                                        </div>
                                    ) : location ? (
                                        <>
                                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-2xl shadow-lg mb-4">
                                                <CheckCircle className="h-8 w-8 text-blue-600" />
                                            </div>
                                            <span className="text-base font-bold text-blue-700 mb-2">Location Detected</span>
                                            <span className="text-xs text-blue-600 px-3 mb-4">{location}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLocation(null); }}
                                                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition text-sm"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <MapPin className="h-8 w-8 text-blue-600" />
                                            </div>
                                            <span className="text-base font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Auto-Detect Location</span>
                                            <span className="text-xs text-gray-400 mt-2">Click to tag GPS</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Nearby Post Offices Locator */}
                        {nearbyOffices.length > 0 && (
                            <div className="mt-8 relative z-10 animate-fade-in-up">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-red-600" />
                                    Nearest Post Offices Detected
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {nearbyOffices.map((office, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-lg hover:border-red-200 transition-all flex flex-col justify-between h-full">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="bg-red-50 p-2 rounded-lg text-red-600">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{office.distance} km</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800 mb-1 line-clamp-1">{office.name}</h4>
                                                <p className="text-xs text-gray-500 font-medium mb-3">{office.type} • {office.time}</p>
                                            </div>
                                            <a href={`tel:${office.phone}`} className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 py-2 rounded-lg text-xs font-bold transition-colors">
                                                <Phone className="h-3 w-3" /> Call: {office.phone}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-5 mt-10 pt-8 border-t-2 border-gray-100 relative z-10">
                            <button onClick={() => setView('list')} className="text-gray-600 font-bold hover:text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-100 transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!newText || loading}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transform hover:scale-105"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    <>Submit Complaint <ChevronRight className="h-5 w-5" /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {view === 'detail' && selectedTicket && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-red-50 to-yellow-50 p-8 border-b-2 border-gray-100">
                                    <button onClick={() => setView('list')} className="text-sm font-bold text-gray-600 hover:text-red-600 mb-4 flex items-center gap-2 transition-colors hover:bg-white px-4 py-2 rounded-xl">
                                        <ChevronRight className="h-4 w-4 rotate-180" /> Back to Complaints
                                    </button>
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-3xl font-black text-gray-900">{selectedTicket.category}</h2>
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(selectedTicket.status)}`}>
                                            {selectedTicket.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 font-mono font-bold">Reference: #{selectedTicket.id}</p>
                                </div>

                                <div className="p-8">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" /> Complaint Description
                                    </h3>
                                    <div className="bg-gradient-to-br from-gray-50 to-yellow-50/30 p-6 rounded-2xl border-2 border-gray-200 text-gray-700 leading-relaxed shadow-sm mb-6">
                                        "{selectedTicket.text}"
                                    </div>
                                    {selectedTicket.image && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Image className="h-4 w-4" /> Attached Evidence
                                            </p>
                                            <img src={selectedTicket.image} className="h-56 w-auto rounded-2xl border-4 border-gray-200 shadow-xl cursor-zoom-in hover:shadow-2xl transition-all" onClick={() => window.open(selectedTicket.image)} />
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* LIVE VISUAL TRACKER COMPONENT */}
                            <TicketVisualizer ticket={selectedTicket} />

                            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-8 flex items-center gap-2">
                                    <Clock className="h-5 w-5" /> Tracking History
                                </h3>
                                <div className="ml-2 pl-8 border-l-4 border-gray-200 space-y-8 relative">
                                    {selectedTicket.statusHistory.map((h, i) => (
                                        <div key={i} className="relative">
                                            <div className={`absolute -left-[42px] w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${i === selectedTicket.statusHistory.length - 1 ? 'bg-gradient-to-br from-red-600 to-red-700 scale-110' : 'bg-gray-300'}`}>
                                                {i === selectedTicket.statusHistory.length - 1 && <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>}
                                            </div>
                                            <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow ml-2">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className={`font-bold ${i === selectedTicket.statusHistory.length - 1 ? 'text-red-700' : 'text-gray-700'}`}>{h.status}</h4>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-mono">{new Date(h.time).toLocaleString('en-IN')}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{h.note}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {selectedTicket.finalResponse ? (
                                <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 border-b-2 border-emerald-100 flex items-center gap-3">
                                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                                            <MessageSquare className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-900">Officer Response</h4>
                                            <p className="text-xs text-emerald-700">Official resolution</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-emerald-50/50 to-white">
                                        <p className="text-emerald-900 leading-relaxed italic">
                                            "{selectedTicket.finalResponse}"
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 flex flex-col items-center text-center">
                                    <Clock className="h-12 w-12 text-gray-300 mb-4 animate-pulse" />
                                    <h4 className="font-bold text-gray-600">Awaiting Response</h4>
                                    <p className="text-xs text-gray-400 mt-2">Officers will update shortly</p>
                                </div>
                            )}

                            {selectedTicket.status === 'Resolved' && !selectedTicket.rating && (
                                <div className="bg-white rounded-3xl shadow-2xl border-2 border-yellow-200 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500"></div>
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-yellow-600">
                                            <Star className="h-8 w-8" />
                                        </div>
                                        <h3 className="font-bold text-xl text-gray-800 mb-2">Rate Resolution</h3>
                                        <p className="text-sm text-gray-500 mb-6">How satisfied are you?</p>
                                        <div className="flex justify-center gap-2 mb-6">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button key={s} onClick={() => setRating(s)} className={`transition-all transform hover:scale-125 p-1 ${rating >= s ? 'text-yellow-500 fill-yellow-500 drop-shadow-lg' : 'text-gray-300 hover:text-yellow-300'}`}>
                                                    <Star className="h-9 w-9" />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            className="w-full p-4 text-sm border-2 border-gray-200 rounded-xl mb-4 focus:ring-4 focus:ring-yellow-200 focus:border-yellow-400 outline-none transition-all resize-none bg-gray-50 focus:bg-white"
                                            rows="3"
                                            placeholder="Share your feedback..."
                                            value={feedback}
                                            onChange={e => setFeedback(e.target.value)}
                                        />
                                        <button onClick={handleRate} className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-4 rounded-2xl font-bold hover:from-black hover:to-gray-900 w-full shadow-xl transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105">
                                            Submit Feedback <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Edit Modal */}
            {
                showProfileModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-up">
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex justify-between items-center text-white">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-gray-400" /> My Profile
                                </h2>
                                <button onClick={() => setShowProfileModal(false)} className="hover:text-red-400 transition-colors">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-8 max-h-[80vh] overflow-y-auto">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative group cursor-pointer mb-2">
                                        {editAvatar ? (
                                            <img src={editAvatar} className="w-24 h-24 rounded-full border-4 border-gray-100 object-cover shadow-lg" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-inner">
                                                <User className="h-10 w-10" />
                                            </div>
                                        )}
                                        <label className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full cursor-pointer hover:bg-red-700 transition shadow-md">
                                            <Camera className="h-4 w-4" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500">Tap icon to change photo</p>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none" value={editName} onChange={e => setEditName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                                            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none" value={editCity} onChange={e => setEditCity(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pincode</label>
                                            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none" value={editPincode} onChange={e => setEditPincode(e.target.value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Security</label>

                                        {!isPasswordVerified ? (
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                {!showPasswordOtp ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleInitialPasswordClick}
                                                        disabled={securityLoading}
                                                        className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                                                    >
                                                        {securityLoading ? 'Sending OTP...' : 'Change Password'}
                                                    </button>
                                                ) : (
                                                    <div className="space-y-3 animate-fade-in">
                                                        <p className="text-xs text-gray-500 text-center">Enter the OTP sent to your email.</p>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="OTP"
                                                                className="flex-1 border rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono"
                                                                value={passwordOtp}
                                                                onChange={e => setPasswordOtp(e.target.value)}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleVerifyPasswordOtp}
                                                                disabled={securityLoading}
                                                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                                                            >
                                                                {securityLoading ? '...' : 'Verify'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in-up">
                                                <label className="block text-xs font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" /> Identity Verified
                                                </label>
                                                <input
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    className="w-full border-2 border-emerald-100 bg-emerald-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                    value={editPassword}
                                                    onChange={e => setEditPassword(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button disabled={profileLoading} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition mt-4 shadow-lg">
                                        {profileLoading ? 'Updating...' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Success Modal */}
            {
                showSuccessModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md">
                        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center transform scale-105 animate-fade-in">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-800 mb-3">Complaint Submitted!</h2>
                            <p className="text-gray-600 mb-8">Your grievance has been successfully registered with India Post.</p>
                            <div className="bg-gradient-to-br from-red-50 to-yellow-50 p-6 rounded-2xl border-2 border-yellow-200 mb-8">
                                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-2">Ticket Reference ID</span>
                                <span className="text-2xl font-mono font-black text-red-600 tracking-wider">#{lastTicketId}</span>
                            </div>
                            <button
                                onClick={() => { setShowSuccessModal(false); setView('list'); }}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white w-full py-4 rounded-2xl font-bold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl transform hover:scale-105"
                            >
                                View Dashboard
                            </button>
                        </div>
                    </div>
                )
            }
            {/* KNOW YOUR POSTMAN MODAL */}
            {
                showPostmanModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-scale-up border-4 border-yellow-400 shadow-2xl">
                            <div className="sticky top-0 bg-yellow-400 p-6 flex justify-between items-center z-10 shadow-md">
                                <h2 className="text-2xl font-black text-red-900 flex items-center gap-3">
                                    <User className="h-8 w-8" />
                                    Your Local Beat Officers
                                </h2>
                                <button onClick={() => setShowPostmanModal(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 text-red-900 transition-colors">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 bg-gradient-to-b from-yellow-50 to-white">
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                                    <p className="text-blue-800 text-sm font-bold">
                                        Below are the nearest India Post officials detected for your location. You can contact them for beat-specific queries.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {nearbyPostmen.length > 0 ? nearbyPostmen.map((postman, idx) => (
                                        <div key={postman.id} className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden hover:border-red-400 transition-all group">
                                            <div className="bg-gray-100 h-24 relative">
                                                <div className="absolute -bottom-8 left-4 w-20 h-20 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-white">
                                                    <img src={postman.image} alt={postman.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> Active
                                                </div>
                                            </div>
                                            <div className="pt-10 p-5">
                                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                                    {postman.name}
                                                    {idx === 0 && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Nearest</span>}
                                                </h3>
                                                <p className="text-sm text-gray-500 font-medium mb-1">{postman.area}</p>
                                                <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {(postman.dist * 111).toFixed(2)} km  away (approx)
                                                </p>

                                                <div className="flex gap-2 mt-4">
                                                    <button className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                                        <Phone className="h-4 w-4" /> Call
                                                    </button>
                                                    <button className="flex-1 bg-white border-2 border-green-500 text-green-600 py-2 rounded-lg font-bold text-sm hover:bg-green-50 transition-all flex items-center justify-center gap-2">
                                                        <MessageSquare className="h-4 w-4" /> Message
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-2 text-center py-10">
                                            <p className="text-gray-500">No officers found nearby based on current coordinates.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserDashboard;